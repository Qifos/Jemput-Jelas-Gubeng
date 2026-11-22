export type OperatorId = 'Gojek' | 'Grab' | 'Maxim';

export type VerificationStatus = 'Simulasi' | 'Terkonfirmasi';

export interface PickupPointData {
  id: string;
  pintuKeluar: string;
  operator: OperatorId;
  namaTitikTemu: string;
  pesanPeringatan: string;
  penandaA: string;
  penandaB: string;
  penandaC: string;
  estimasiJalanKaki: string;
  statusVerifikasi: VerificationStatus;
  sumberInformasi: string;
  tanggalPemeriksaan: string; // YYYY-MM-DD
}

export interface PickupPointFormInput {
  pintuKeluar: string;
  operator: OperatorId;
  namaTitikTemu: string;
  pesanPeringatan: string;
  penandaA: string;
  penandaB: string;
  penandaC: string;
  estimasiJalanKaki: string;
  statusVerifikasi: VerificationStatus;
  sumberInformasi: string;
  tanggalPemeriksaan: string;
}

export type FormFieldKey = keyof PickupPointFormInput;

export type FormValidationErrors = Partial<Record<FormFieldKey, string>>;

export type AppTab = 'penumpang' | 'kelola' | 'qr';

export type PassengerScreen =
  | 'panduan'
  | 'rute'
  | 'ojol'
  | 'cek'
  | 'selesai'
  | 'pemulihan';

export type OjolOriginScreen = 'panduan' | 'rute' | 'pemulihan';

export type MapMarkerKey = 'A' | 'B' | 'C';

export interface VehicleCheckState {
  pelatSesuai: boolean;
  jenisWarnaSesuai: boolean;
  namaPengemudiSesuai: boolean;
}
