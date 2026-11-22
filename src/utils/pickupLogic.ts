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
}

const VALID_STATUSES: VerificationStatus[] = ['Simulasi', 'Terkonfirmasi'];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const MIN_TEXT_LENGTH = 3;

export function validatePickupPointForm(
  input: PickupPointFormInput,
): ValidationResult {
  const errors: FormValidationErrors = {};

  const pintuKeluar = input.pintuKeluar.trim();
  const namaTitikTemu = input.namaTitikTemu.trim();
  const pesanPeringatan = input.pesanPeringatan.trim();
  const penandaA = input.penandaA.trim();
  const penandaB = input.penandaB.trim();
  const penandaC = input.penandaC.trim();
  const sumberInformasi = input.sumberInformasi.trim();
  const tanggalPemeriksaan = input.tanggalPemeriksaan.trim();
  const rawEstimate = input.estimasiJalanKaki.trim();

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

  const valid = Object.keys(errors).length === 0;

  if (!valid) {
    return { valid: false, errors };
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

export function isPassengerModeFromSearch(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.get('mode')?.toLowerCase() === 'penumpang';
}

export function buildPublicPassengerUrl(
  protocol: string,
  origin: string,
  pathname: string,
): string {
  if (protocol === 'http:' || protocol === 'https:') {
    const cleanPath = pathname || '/';
    return `${origin}${cleanPath}?mode=penumpang`;
  }
  return 'https://jemputjelasgubeng.example/?mode=penumpang';
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

