import {
  DEFAULT_ESTIMATE_LABEL,
  DEFAULT_PICKUP_POINTS,
  OPERATOR_LIST,
} from '../data/defaultPickupPoints';
import {
  FormValidationErrors,
  OperatorId,
  PickupPointData,
  PickupPointFormInput,
  VehicleCheckState,
  VerificationStatus,
} from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: FormValidationErrors;
  sanitized?: PickupPointFormInput;
  duplicateError?: string;
}

export const DUPLICATE_COMBO_ERROR =
  'Kombinasi pintu keluar dan operator ini sudah terdaftar. Gunakan tombol Edit pada data yang ada atau masukkan nama pintu keluar baru.';

const VALID_STATUSES: VerificationStatus[] = ['Simulasi', 'Terkonfirmasi'];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const MIN_TEXT_LENGTH = 3;

export function normalizeComboKey(pintuKeluar: string, operator: OperatorId): string {
  return `${pintuKeluar.trim().toLowerCase()}::${operator}`;
}

export function findDuplicatePickupPoint(
  points: PickupPointData[],
  pintuKeluar: string,
  operator: OperatorId,
  excludeId?: string,
): PickupPointData | undefined {
  const targetKey = normalizeComboKey(pintuKeluar, operator);
  return points.find(
    (point) =>
      point.id !== excludeId &&
      normalizeComboKey(point.pintuKeluar, point.operator) === targetKey,
  );
}

export function validatePickupPointForm(
  input: PickupPointFormInput,
  existingPoints?: PickupPointData[],
  excludeId?: string,
): ValidationResult {
  const errors: FormValidationErrors = {};

  const pintuKeluar = typeof input.pintuKeluar === 'string' ? input.pintuKeluar.trim() : '';
  const namaTitikTemu = typeof input.namaTitikTemu === 'string' ? input.namaTitikTemu.trim() : '';
  const pesanPeringatan =
    typeof input.pesanPeringatan === 'string' ? input.pesanPeringatan.trim() : '';
  const penandaA = typeof input.penandaA === 'string' ? input.penandaA.trim() : '';
  const penandaB = typeof input.penandaB === 'string' ? input.penandaB.trim() : '';
  const penandaC = typeof input.penandaC === 'string' ? input.penandaC.trim() : '';
  const sumberInformasi =
    typeof input.sumberInformasi === 'string' ? input.sumberInformasi.trim() : '';
  const tanggalPemeriksaan =
    typeof input.tanggalPemeriksaan === 'string' ? input.tanggalPemeriksaan.trim() : '';
  const rawEstimate =
    typeof input.estimasiJalanKaki === 'string' ? input.estimasiJalanKaki.trim() : '';

  if (!pintuKeluar) {
    errors.pintuKeluar = 'Pintu keluar wajib diisi.';
  } else if (pintuKeluar.length < MIN_TEXT_LENGTH) {
    errors.pintuKeluar = 'Pintu keluar minimal 3 karakter.';
  }

  if (!OPERATOR_LIST.includes(input.operator)) {
    errors.operator = 'Pilih operator layanan yang valid (Gojek, Grab, atau Maxim).';
  }

  if (!namaTitikTemu) {
    errors.namaTitikTemu = 'Nama titik temu wajib diisi.';
  } else if (namaTitikTemu.length < MIN_TEXT_LENGTH) {
    errors.namaTitikTemu = 'Nama titik temu minimal 3 karakter.';
  }

  if (!pesanPeringatan) {
    errors.pesanPeringatan = 'Pesan peringatan lokasi wajib diisi.';
  } else if (pesanPeringatan.length < MIN_TEXT_LENGTH) {
    errors.pesanPeringatan = 'Pesan peringatan lokasi minimal 3 karakter.';
  }

  if (!penandaA) {
    errors.penandaA = 'Penanda A (Area Awal) wajib diisi.';
  } else if (penandaA.length < MIN_TEXT_LENGTH) {
    errors.penandaA = 'Penanda A minimal 3 karakter.';
  }

  if (!penandaB) {
    errors.penandaB = 'Penanda B (Jalur / Landmark Tengah) wajib diisi.';
  } else if (penandaB.length < MIN_TEXT_LENGTH) {
    errors.penandaB = 'Penanda B minimal 3 karakter.';
  }

  if (!penandaC) {
    errors.penandaC = 'Penanda C (Deskripsi Titik Temu) wajib diisi.';
  } else if (penandaC.length < MIN_TEXT_LENGTH) {
    errors.penandaC = 'Penanda C minimal 3 karakter.';
  }

  if (!VALID_STATUSES.includes(input.statusVerifikasi)) {
    errors.statusVerifikasi = 'Pilih status verifikasi (Simulasi atau Terkonfirmasi).';
  }

  if (!sumberInformasi) {
    errors.sumberInformasi = 'Sumber informasi / penanggung jawab wajib diisi.';
  } else if (sumberInformasi.length < MIN_TEXT_LENGTH) {
    errors.sumberInformasi = 'Sumber informasi minimal 3 karakter.';
  }

  if (!tanggalPemeriksaan) {
    errors.tanggalPemeriksaan = 'Tanggal pemeriksaan wajib diisi.';
  } else if (!ISO_DATE_PATTERN.test(tanggalPemeriksaan)) {
    errors.tanggalPemeriksaan = 'Format tanggal pemeriksaan tidak valid.';
  }

  let duplicateError: string | undefined;
  if (
    !errors.pintuKeluar &&
    !errors.operator &&
    Array.isArray(existingPoints) &&
    findDuplicatePickupPoint(existingPoints, pintuKeluar, input.operator, excludeId)
  ) {
    duplicateError = DUPLICATE_COMBO_ERROR;
    errors.pintuKeluar = DUPLICATE_COMBO_ERROR;
  }

  const valid = Object.keys(errors).length === 0;

  if (!valid) {
    return { valid: false, errors, duplicateError };
  }

  return {
    valid: true,
    errors: {},
    sanitized: {
      pintuKeluar,
      operator: input.operator,
      namaTitikTemu,
      pesanPeringatan,
      penandaA,
      penandaB,
      penandaC,
      estimasiJalanKaki: rawEstimate || DEFAULT_ESTIMATE_LABEL,
      statusVerifikasi: input.statusVerifikasi,
      sumberInformasi,
      tanggalPemeriksaan,
    },
  };
}

export function normalizePickupPoints(raw: unknown): PickupPointData[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_PICKUP_POINTS.map((item) => ({ ...item }));
  }

  const cleaned: PickupPointData[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const candidate = item as Record<string, unknown>;
    const id = typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id.trim() : '';
    const operator = candidate.operator as OperatorId;
    const statusVerifikasi = candidate.statusVerifikasi as VerificationStatus;

    if (
      !id ||
      typeof candidate.pintuKeluar !== 'string' ||
      !OPERATOR_LIST.includes(operator) ||
      typeof candidate.namaTitikTemu !== 'string' ||
      typeof candidate.pesanPeringatan !== 'string' ||
      typeof candidate.penandaA !== 'string' ||
      typeof candidate.penandaB !== 'string' ||
      typeof candidate.penandaC !== 'string' ||
      !VALID_STATUSES.includes(statusVerifikasi) ||
      typeof candidate.sumberInformasi !== 'string' ||
      typeof candidate.tanggalPemeriksaan !== 'string'
    ) {
      continue;
    }

    const estimasi =
      typeof candidate.estimasiJalanKaki === 'string' && candidate.estimasiJalanKaki.trim()
        ? candidate.estimasiJalanKaki.trim()
        : DEFAULT_ESTIMATE_LABEL;

    cleaned.push({
      id,
      pintuKeluar: candidate.pintuKeluar.trim(),
      operator,
      namaTitikTemu: candidate.namaTitikTemu.trim(),
      pesanPeringatan: candidate.pesanPeringatan.trim(),
      penandaA: candidate.penandaA.trim(),
      penandaB: candidate.penandaB.trim(),
      penandaC: candidate.penandaC.trim(),
      estimasiJalanKaki: estimasi,
      statusVerifikasi,
      sumberInformasi: candidate.sumberInformasi.trim(),
      tanggalPemeriksaan: candidate.tanggalPemeriksaan.trim(),
    });
  }

  return cleaned.length > 0 ? cleaned : DEFAULT_PICKUP_POINTS.map((item) => ({ ...item }));
}

export function getUniqueExits(points: PickupPointData[]): string[] {
  const seen = new Set<string>();
  const exits: string[] = [];
  for (const point of points) {
    if (!seen.has(point.pintuKeluar)) {
      seen.add(point.pintuKeluar);
      exits.push(point.pintuKeluar);
    }
  }
  return exits;
}

export function getOperatorsForExit(
  points: PickupPointData[],
  pintuKeluar: string,
): OperatorId[] {
  const available = new Set<OperatorId>();
  for (const point of points) {
    if (point.pintuKeluar === pintuKeluar) {
      available.add(point.operator);
    }
  }
  return OPERATOR_LIST.filter((op) => available.has(op));
}

export function findMatchingPoint(
  points: PickupPointData[],
  pintuKeluar: string,
  operator: OperatorId,
): PickupPointData | undefined {
  const exact = points.find(
    (p) => p.pintuKeluar === pintuKeluar && p.operator === operator,
  );
  if (exact) {
    return exact;
  }
  const byExit = points.find((p) => p.pintuKeluar === pintuKeluar);
  if (byExit) {
    return byExit;
  }
  return points[0];
}

export interface VehicleChecklistEvaluation {
  checkedCount: number;
  total: number;
  isComplete: boolean;
  missingKeys: Array<keyof VehicleCheckState>;
}

export function evaluateVehicleChecklist(
  state: VehicleCheckState,
): VehicleChecklistEvaluation {
  const keys: Array<keyof VehicleCheckState> = [
    'pelatSesuai',
    'jenisWarnaSesuai',
    'namaPengemudiSesuai',
  ];
  const missingKeys = keys.filter((k) => !state[k]);
  const checkedCount = keys.length - missingKeys.length;
  return {
    checkedCount,
    total: keys.length,
    isComplete: missingKeys.length === 0,
    missingKeys,
  };
}

export interface ParsedPassengerQuery {
  isPassengerMode: boolean;
  pintu: string | null;
  operator: OperatorId | null;
}

export function parsePassengerQueryParams(search: string): ParsedPassengerQuery {
  const params = new URLSearchParams(search);
  const mode = params.get('mode')?.trim().toLowerCase() ?? '';
  const rawPintu = params.get('pintu')?.trim() ?? '';
  const rawOp = params.get('operator')?.trim().toLowerCase() ?? '';

  const matchedOperator =
    OPERATOR_LIST.find((op) => op.toLowerCase() === rawOp) ?? null;

  return {
    isPassengerMode: mode === 'penumpang',
    pintu: rawPintu || null,
    operator: matchedOperator,
  };
}

export function isPassengerModeFromSearch(search: string): boolean {
  return parsePassengerQueryParams(search).isPassengerMode;
}

export function resolveInitialSelection(
  points: PickupPointData[],
  query: Pick<ParsedPassengerQuery, 'pintu' | 'operator'>,
): { selectedExit: string; selectedOperator: OperatorId } {
  const fallback = points[0] ?? DEFAULT_PICKUP_POINTS[0];

  let matchedExit: string | null = null;
  if (query.pintu) {
    const normalizedQueryPintu = query.pintu.trim().toLowerCase();
    const foundByExit = points.find(
      (p) => p.pintuKeluar.trim().toLowerCase() === normalizedQueryPintu,
    );
    if (foundByExit) {
      matchedExit = foundByExit.pintuKeluar;
    }
  }

  if (matchedExit) {
    const opsForExit = getOperatorsForExit(points, matchedExit);
    if (query.operator && opsForExit.includes(query.operator)) {
      return { selectedExit: matchedExit, selectedOperator: query.operator };
    }
    return {
      selectedExit: matchedExit,
      selectedOperator: opsForExit[0] ?? fallback.operator,
    };
  }

  if (query.operator) {
    const foundByOp = points.find((p) => p.operator === query.operator);
    if (foundByOp) {
      return {
        selectedExit: foundByOp.pintuKeluar,
        selectedOperator: foundByOp.operator,
      };
    }
  }

  return {
    selectedExit: fallback.pintuKeluar,
    selectedOperator: fallback.operator,
  };
}

export function buildPublicPassengerUrl(
  protocol: string,
  origin: string,
  pathname: string,
  targetPintu?: string,
): string {
  const base =
    protocol === 'http:' || protocol === 'https:'
      ? `${origin}${pathname || '/'}`
      : 'https://jemputjelasgubeng.example/';

  const params = new URLSearchParams();
  params.set('mode', 'penumpang');

  const trimmedPintu = targetPintu?.trim();
  if (trimmedPintu) {
    params.set('pintu', trimmedPintu);
  }

  return `${base}?${params.toString()}`;
}

export function isSafeHttpUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const INDONESIAN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function formatIndonesianDate(isoDate: string): string {
  if (!ISO_DATE_PATTERN.test(isoDate)) {
    return isoDate;
  }
  const [yearStr, monthStr, dayStr] = isoDate.split('-');
  const monthIdx = Number(monthStr) - 1;
  const day = Number(dayStr);
  if (monthIdx < 0 || monthIdx > 11 || Number.isNaN(day)) {
    return isoDate;
  }
  return `${day} ${INDONESIAN_MONTHS[monthIdx]} ${yearStr}`;
}

export function createEmptyFormInput(todayIso: string): PickupPointFormInput {
  return {
    pintuKeluar: '',
    operator: 'Gojek',
    namaTitikTemu: '',
    pesanPeringatan: '',
    penandaA: '',
    penandaB: '',
    penandaC: '',
    estimasiJalanKaki: '',
    statusVerifikasi: 'Simulasi',
    sumberInformasi: '',
    tanggalPemeriksaan: todayIso,
  };
}

export function createPointId(pintuKeluar: string, operator: OperatorId): string {
  const slug = pintuKeluar
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28);
  const rand = Math.random().toString(36).slice(2, 7);
  return `${slug || 'titik'}-${operator.toLowerCase()}-${rand}`;
}

export function wrapLabelLines(
  text: string,
  maxCharsPerLine: number,
  maxLines = 2,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let current = '';

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      if (lines.length === maxLines - 1) {
        const remaining = [word, ...words.slice(i + 1)].join(' ');
        current =
          remaining.length > maxCharsPerLine
            ? `${remaining.slice(0, maxCharsPerLine - 1).trimEnd()}…`
            : remaining;
        break;
      }
      current =
        word.length > maxCharsPerLine
          ? `${word.slice(0, maxCharsPerLine - 1)}…`
          : word;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines.slice(0, maxLines);
}
