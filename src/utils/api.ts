import {
  FormValidationErrors,
  PickupPointData,
  PickupPointFormInput,
} from '../types';
import {
  createPointId,
  DUPLICATE_COMBO_ERROR,
  findDuplicatePickupPoint,
  normalizePickupPoints,
  validatePickupPointForm,
} from './pickupLogic';
import {
  loadPickupPoints,
  resetPickupPointsToDefault,
  savePickupPoints,
} from './storage';

export type StorageMode = 'server' | 'local';

export class ApiValidationError extends Error {
  status: number;
  errors?: FormValidationErrors;

  constructor(message: string, status: number, errors?: FormValidationErrors) {
    super(message);
    this.name = 'ApiValidationError';
    this.status = status;
    this.errors = errors;
  }
}

export interface PickupPointsApiResult {
  items: PickupPointData[];
  savedPoint?: PickupPointData;
  storageMode: StorageMode;
}

const API_BASE = '/api/pickup-points';

async function parseJsonSafe(response: Response): Promise<Record<string, unknown> | null> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return null;
  }
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isClientValidationStatus(status: number): boolean {
  return status === 400 || status === 404 || status === 409;
}

export async function fetchPickupPoints(): Promise<PickupPointsApiResult> {
  try {
    const response = await fetch(API_BASE, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const body = await parseJsonSafe(response);
    if (response.ok && body && Array.isArray(body.items)) {
      const items = normalizePickupPoints(body.items);
      savePickupPoints(items);
      return { items, storageMode: 'server' };
    }
  } catch {
    // Fallback to localStorage below when backend is unreachable
  }

  return {
    items: loadPickupPoints(),
    storageMode: 'local',
  };
}

export async function createPickupPointApi(
  input: PickupPointFormInput,
  currentPoints: PickupPointData[],
): Promise<PickupPointsApiResult> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(input),
    });
    const body = await parseJsonSafe(response);

    if (response.ok && body && Array.isArray(body.items)) {
      const items = normalizePickupPoints(body.items);
      savePickupPoints(items);
      const savedPoint = body.data as PickupPointData | undefined;
      return { items, savedPoint, storageMode: 'server' };
    }

    if (body && isClientValidationStatus(response.status)) {
      throw new ApiValidationError(
        typeof body.error === 'string'
          ? body.error
          : 'Data tidak valid atau sudah terdaftar.',
        response.status,
        body.errors as FormValidationErrors | undefined,
      );
    }
  } catch (err) {
    if (err instanceof ApiValidationError) {
      throw err;
    }
    // Network/static fallback to localStorage
  }

  const validation = validatePickupPointForm(input, currentPoints);
  if (!validation.valid || !validation.sanitized) {
    const status = validation.duplicateError ? 409 : 400;
    throw new ApiValidationError(
      validation.duplicateError ?? 'Periksa kembali kolom yang wajib diisi.',
      status,
      validation.errors,
    );
  }

  const created: PickupPointData = {
    id: createPointId(validation.sanitized.pintuKeluar, validation.sanitized.operator),
    ...validation.sanitized,
  };
  const nextPoints = [...currentPoints, created];
  savePickupPoints(nextPoints);
  return { items: nextPoints, savedPoint: created, storageMode: 'local' };
}

export async function updatePickupPointApi(
  id: string,
  input: PickupPointFormInput,
  currentPoints: PickupPointData[],
): Promise<PickupPointsApiResult> {
  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(input),
    });
    const body = await parseJsonSafe(response);

    if (response.ok && body && Array.isArray(body.items)) {
      const items = normalizePickupPoints(body.items);
      savePickupPoints(items);
      const savedPoint = body.data as PickupPointData | undefined;
      return { items, savedPoint, storageMode: 'server' };
    }

    if (body && isClientValidationStatus(response.status)) {
      throw new ApiValidationError(
        typeof body.error === 'string'
          ? body.error
          : 'Data tidak valid atau sudah terdaftar.',
        response.status,
        body.errors as FormValidationErrors | undefined,
      );
    }
  } catch (err) {
    if (err instanceof ApiValidationError) {
      throw err;
    }
    // Network/static fallback to localStorage
  }

  const validation = validatePickupPointForm(input, currentPoints, id);
  if (!validation.valid || !validation.sanitized) {
    const status = validation.duplicateError ? 409 : 400;
    throw new ApiValidationError(
      validation.duplicateError ?? 'Periksa kembali kolom yang wajib diisi.',
      status,
      validation.errors,
    );
  }

  if (findDuplicatePickupPoint(currentPoints, validation.sanitized.pintuKeluar, validation.sanitized.operator, id)) {
    throw new ApiValidationError(DUPLICATE_COMBO_ERROR, 409, {
      pintuKeluar: DUPLICATE_COMBO_ERROR,
    });
  }

  const updated: PickupPointData = {
    id,
    ...validation.sanitized,
  };
  const nextPoints = currentPoints.map((p) => (p.id === id ? updated : p));
  savePickupPoints(nextPoints);
  return { items: nextPoints, savedPoint: updated, storageMode: 'local' };
}

export async function deletePickupPointApi(
  id: string,
  currentPoints: PickupPointData[],
): Promise<PickupPointsApiResult> {
  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
    const body = await parseJsonSafe(response);

    if (response.ok && body && Array.isArray(body.items)) {
      const items = normalizePickupPoints(body.items);
      savePickupPoints(items);
      return { items, storageMode: 'server' };
    }

    if (body && isClientValidationStatus(response.status)) {
      throw new ApiValidationError(
        typeof body.error === 'string'
          ? body.error
          : 'Gagal menghapus data titik jemput.',
        response.status,
      );
    }
  } catch (err) {
    if (err instanceof ApiValidationError) {
      throw err;
    }
    // Network/static fallback
  }

  if (currentPoints.length <= 1) {
    throw new ApiValidationError(
      'Minimal harus tersisa 1 data titik jemput agar panduan penumpang tetap berfungsi.',
      400,
    );
  }

  const nextPoints = currentPoints.filter((p) => p.id !== id);
  savePickupPoints(nextPoints);
  return { items: nextPoints, storageMode: 'local' };
}

export async function resetPickupPointsApi(): Promise<PickupPointsApiResult> {
  try {
    const response = await fetch(`${API_BASE}/reset`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    const body = await parseJsonSafe(response);

    if (response.ok && body && Array.isArray(body.items)) {
      const items = normalizePickupPoints(body.items);
      savePickupPoints(items);
      return { items, storageMode: 'server' };
    }
  } catch {
    // Network/static fallback
  }

  const defaults = resetPickupPointsToDefault();
  return { items: defaults, storageMode: 'local' };
}
