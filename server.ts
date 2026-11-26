import express, { Request, Response } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_PICKUP_POINTS } from './src/data/defaultPickupPoints';
import { PickupPointData, PickupPointFormInput } from './src/types';
import {
  createPointId,
  DUPLICATE_COMBO_ERROR,
  findDuplicatePickupPoint,
  normalizePickupPoints,
  validatePickupPointForm,
} from './src/utils/pickupLogic';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'pickup-points.json');

// Serialize writes so concurrent API calls never interleave file updates
let writeChain: Promise<void> = Promise.resolve();

function queueWrite<T>(task: () => Promise<T>): Promise<T> {
  const result = writeChain.then(task, task);
  writeChain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function writePointsFile(points: PickupPointData[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tempPath = `${DATA_FILE}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(points, null, 2)}\n`, 'utf-8');
  await fs.rename(tempPath, DATA_FILE);
}

async function readOrInitPoints(): Promise<PickupPointData[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    return normalizePickupPoints(parsed);
  } catch {
    const defaults = DEFAULT_PICKUP_POINTS.map((item) => ({ ...item }));
    await writePointsFile(defaults);
    return defaults;
  }
}

function toFormInput(body: unknown): PickupPointFormInput {
  const obj = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  return {
    pintuKeluar: typeof obj.pintuKeluar === 'string' ? obj.pintuKeluar : '',
    operator: obj.operator as PickupPointFormInput['operator'],
    namaTitikTemu: typeof obj.namaTitikTemu === 'string' ? obj.namaTitikTemu : '',
    pesanPeringatan: typeof obj.pesanPeringatan === 'string' ? obj.pesanPeringatan : '',
    penandaA: typeof obj.penandaA === 'string' ? obj.penandaA : '',
    penandaB: typeof obj.penandaB === 'string' ? obj.penandaB : '',
    penandaC: typeof obj.penandaC === 'string' ? obj.penandaC : '',
    estimasiJalanKaki: typeof obj.estimasiJalanKaki === 'string' ? obj.estimasiJalanKaki : '',
    statusVerifikasi: obj.statusVerifikasi as PickupPointFormInput['statusVerifikasi'],
    sumberInformasi: typeof obj.sumberInformasi === 'string' ? obj.sumberInformasi : '',
    tanggalPemeriksaan: typeof obj.tanggalPemeriksaan === 'string' ? obj.tanggalPemeriksaan : '',
  };
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  // Ensure persistent JSON store is initialized on boot
  await queueWrite(() => readOrInitPoints());

  // GET /api/pickup-points
  app.get('/api/pickup-points', async (_req: Request, res: Response) => {
    try {
      const items = await readOrInitPoints();
      res.json({ items });
    } catch {
      res.status(500).json({ error: 'Gagal membaca data titik jemput.' });
    }
  });

  // POST /api/pickup-points
  app.post('/api/pickup-points', async (req: Request, res: Response) => {
    try {
      const input = toFormInput(req.body);
      const outcome = await queueWrite(async () => {
        const current = await readOrInitPoints();
        const validation = validatePickupPointForm(input);
        if (!validation.valid || !validation.sanitized) {
          return {
            status: 400 as const,
            body: {
              error: 'Periksa kembali kolom wajib yang belum valid.',
              errors: validation.errors,
            },
          };
        }

        if (
          findDuplicatePickupPoint(
            current,
            validation.sanitized.pintuKeluar,
            validation.sanitized.operator,
          )
        ) {
          return {
            status: 409 as const,
            body: {
              error: DUPLICATE_COMBO_ERROR,
              errors: { pintuKeluar: DUPLICATE_COMBO_ERROR },
            },
          };
        }

        const created: PickupPointData = {
          id: createPointId(validation.sanitized.pintuKeluar, validation.sanitized.operator),
          ...validation.sanitized,
        };
        const updatedList = [...current, created];
        await writePointsFile(updatedList);
        return {
          status: 201 as const,
          body: { data: created, items: updatedList },
        };
      });

      res.status(outcome.status).json(outcome.body);
    } catch {
      res.status(500).json({ error: 'Gagal menyimpan data titik jemput.' });
    }
  });

  // POST /api/pickup-points/reset
  app.post('/api/pickup-points/reset', async (_req: Request, res: Response) => {
    try {
      const defaults = await queueWrite(async () => {
        const items = DEFAULT_PICKUP_POINTS.map((item) => ({ ...item }));
        await writePointsFile(items);
        return items;
      });
      res.json({ items: defaults });
    } catch {
      res.status(500).json({ error: 'Gagal mengembalikan data bawaan.' });
    }
  });

  // PUT /api/pickup-points/:id
  app.put('/api/pickup-points/:id', async (req: Request, res: Response) => {
    try {
      const targetId = String(req.params.id || '').trim();
      const input = toFormInput(req.body);
      const outcome = await queueWrite(async () => {
        const current = await readOrInitPoints();
        const existingIndex = current.findIndex((p) => p.id === targetId);
        if (existingIndex === -1) {
          return {
            status: 404 as const,
            body: { error: 'Data titik jemput tidak ditemukan.' },
          };
        }

        const validation = validatePickupPointForm(input);
        if (!validation.valid || !validation.sanitized) {
          return {
            status: 400 as const,
            body: {
              error: 'Periksa kembali kolom wajib yang belum valid.',
              errors: validation.errors,
            },
          };
        }

        if (
          findDuplicatePickupPoint(
            current,
            validation.sanitized.pintuKeluar,
            validation.sanitized.operator,
            targetId,
          )
        ) {
          return {
            status: 409 as const,
            body: {
              error: DUPLICATE_COMBO_ERROR,
              errors: { pintuKeluar: DUPLICATE_COMBO_ERROR },
            },
          };
        }

        const updated: PickupPointData = {
          id: targetId,
          ...validation.sanitized,
        };
        const updatedList = current.map((p) => (p.id === targetId ? updated : p));
        await writePointsFile(updatedList);
        return {
          status: 200 as const,
          body: { data: updated, items: updatedList },
        };
      });

      res.status(outcome.status).json(outcome.body);
    } catch {
      res.status(500).json({ error: 'Gagal memperbarui data titik jemput.' });
    }
  });

  // DELETE /api/pickup-points/:id
  app.delete('/api/pickup-points/:id', async (req: Request, res: Response) => {
    try {
      const targetId = String(req.params.id || '').trim();
      const outcome = await queueWrite(async () => {
        const current = await readOrInitPoints();
        if (current.length <= 1) {
          return {
            status: 400 as const,
            body: {
              error:
                'Minimal harus tersisa 1 data titik jemput agar panduan penumpang tetap berfungsi.',
            },
          };
        }

        const exists = current.some((p) => p.id === targetId);
        if (!exists) {
          return {
            status: 404 as const,
            body: { error: 'Data titik jemput tidak ditemukan.' },
          };
        }

        const updatedList = current.filter((p) => p.id !== targetId);
        await writePointsFile(updatedList);
        return {
          status: 200 as const,
          body: { deletedId: targetId, items: updatedList },
        };
      });

      res.status(outcome.status).json(outcome.body);
    } catch {
      res.status(500).json({ error: 'Gagal menghapus data titik jemput.' });
    }
  });

  // Mount Vite dev middleware or serve production static bundle
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jemput Jelas Gubeng server listening on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
