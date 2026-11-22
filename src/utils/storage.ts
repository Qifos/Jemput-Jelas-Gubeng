import { DEFAULT_PICKUP_POINTS } from '../data/defaultPickupPoints';
import { PickupPointData } from '../types';
import { normalizePickupPoints } from './pickupLogic';

export const STORAGE_KEY = 'jemput_jelas_gubeng_pickup_points_v1';

export function loadPickupPoints(): PickupPointData[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PICKUP_POINTS.map((item) => ({ ...item }));
    }
    const parsed: unknown = JSON.parse(raw);
    return normalizePickupPoints(parsed);
  } catch {
    return DEFAULT_PICKUP_POINTS.map((item) => ({ ...item }));
  }
}

export function savePickupPoints(points: PickupPointData[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  } catch {
    // Ignore storage quota or restricted iframe storage exceptions gracefully
  }
}

export function resetPickupPointsToDefault(): PickupPointData[] {
  const defaults = DEFAULT_PICKUP_POINTS.map((item) => ({ ...item }));
  savePickupPoints(defaults);
  return defaults;
}
