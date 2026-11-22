import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Footprints,
  Info,
  MapPin,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { OPERATOR_FALLBACKS } from '../data/defaultPickupPoints';
import {
  MapMarkerKey,
  OjolOriginScreen,
  OperatorId,
  PassengerScreen,
  PickupPointData,
  VehicleCheckState,
} from '../types';
import {
  evaluateVehicleChecklist,
  formatIndonesianDate,
  getOperatorsForExit,
  getUniqueExits,
} from '../utils/pickupLogic';
import { SchematicMapSvg } from './SchematicMapSvg';
import { StatusBanner } from './StatusBanner';

interface PassengerViewProps {
  points: PickupPointData[];
  selectedExit: string;
  selectedOperator: OperatorId;
  activePoint: PickupPointData;
  isStandaloneMode: boolean;
  onChangeExit: (exit: string) => void;
  onChangeOperator: (operator: OperatorId) => void;
}

const INITIAL_CHECKS: VehicleCheckState = {
  pelatSesuai: false,
  jenisWarnaSesuai: false,
  namaPengemudiSesuai: false,
};

const CHECK_ITEMS: Array<{
  key: keyof VehicleCheckState;
  title: string;
  description: string;
}> = [
  {
    key: 'pelatSesuai',
    title: 'Nomor pelat kendaraan sesuai',
    description: 'Cocokkan huruf dan angka pelat kendaraan secara langsung dengan yang tertera di aplikasi.',
  },
  {
    key: 'jenisWarnaSesuai',
    title: 'Jenis dan warna kendaraan sesuai',
    description: 'Pastikan tipe motor/mobil dan warna kendaraan sama dengan detail pesanan Anda.',
  },
  {
    key: 'namaPengemudiSesuai',
    title: 'Nama pengemudi sesuai pesanan',
    description: 'Konfirmasi nama pengemudi (dan foto profil di aplikasi) sebelum naik ke kendaraan.',
  },
];

export function PassengerView({
  points,
  selectedExit,
  selectedOperator,
  activePoint,
  isStandaloneMode,
  onChangeExit,
  onChangeOperator,
}: PassengerViewProps) {
  const [screen, setScreen] = useState<PassengerScreen>('panduan');
  const [ojolOrigin, setOjolOrigin] = useState<OjolOriginScreen>('panduan');
  const [activeMarker, setActiveMarker] = useState<MapMarkerKey>('A');
  const [checks, setChecks] = useState<VehicleCheckState>(INITIAL_CHECKS);
  const [showCheckValidationError, setShowCheckValidationError] = useState(false);

  const uniqueExits = getUniqueExits(points);
  const availableOperators = getOperatorsForExit(points, selectedExit);
  const checklistEval = evaluateVehicleChecklist(checks);

  const openOjolFrom = (origin: OjolOriginScreen) => {
    setOjolOrigin(origin);
    setScreen('ojol');
  };

  const handleToggleCheck = (key: keyof VehicleCheckState) => {
    setChecks((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (evaluateVehicleChecklist(next).isComplete) {
        setShowCheckValidationError(false);
      }
      return next;
    });
  };

  const handleConfirmVehicleReady = () => {
    if (!checklistEval.isComplete) {
      setShowCheckValidationError(true);
      return;
    }
    setShowCheckValidationError(false);
    setScreen('selesai');
  };

  const handleResetSimulation = () => {
    setChecks(INITIAL_CHECKS);
    setShowCheckValidationError(false);
    setActiveMarker('A');
    setScreen('panduan');
  };

  const currentStepNumber =
    screen === 'panduan'
      ? 1
      : screen === 'rute' || screen === 'ojol'
        ? 2
        : 3;

  const markerTabMeta: Array<{
    key: MapMarkerKey;
    shortLabel: string;
    title: string;
    content: string;
  }> = [
    {
      key: 'A',
      shortLabel: 'A · Pintu Keluar',
      title: 'Penanda A — Area Awal / Pintu Keluar',
      content: activePoint.penandaA,
    },
    {
      key: 'B',
      shortLabel: 'B · Jalur Trotoar',
      title: 'Penanda B — Jalur / Landmark Tengah',
      content: activePoint.penandaB,
    },
    {
      key: 'C',
      shortLabel: 'C · Titik Temu',
      title: `Penanda C — ${activePoint.namaTitikTemu}`,
      content: activePoint.penandaC,
    },
  ];

  const activeMarkerData =
    markerTabMeta.find((m) => m.key === activeMarker) ?? markerTabMeta[0];

  const ojolBackLabel =
    ojolOrigin === 'panduan'
      ? 'Kembali ke Panduan'
      : ojolOrigin === 'rute'
        ? 'Kembali ke Rute & Penanda'
        : 'Kembali ke Pemulihan Aman';

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Standalone clean header for ?mode=penumpang */}
      {isStandaloneMode && (
        <div className="mb-4 rounded-2xl bg-[#0b6b50] px-4 py-3.5 text-white shadow-sm">
          <p className="text-[11px] font-semibold tracking-wide text-[#bde8d6]">
            PANDUAN PENUMPANG • STASIUN GUBENG LAMA, SURABAYA
          </p>
          <h1 className="mt-0.5 text-lg font-bold tracking-tight">Jemput Jelas Gubeng</h1>
        </div>
      )}

      {/* Main Mobile Passenger Card */}
      <div className="overflow-hidden rounded-2xl border border-[#d4e2dc] bg-white shadow-sm">
        {/* Dynamic Exit & Operator Selector Header */}
        <div className="border-b border-[#e3ede8] bg-[#f7faf8] px-4 pt-4 pb-3.5 sm:px-5">
          <div className="space-y-3">
            <div>
              <label
                htmlFor="passenger-exit-select"
                className="mb-1 block text-xs font-semibold text-[#2d4d40]"
              >
                Pintu Keluar
              </label>
              <select
                id="passenger-exit-select"
                value={selectedExit}
                onChange={(e) => {
                  onChangeExit(e.target.value);
                  setActiveMarker('A');
                }}
                className="min-h-[42px] w-full rounded-xl border border-[#c7dbd2] bg-white px-3 py-2 text-sm font-semibold text-[#10241d] transition-colors focus:border-[#0b6b50] focus:ring-2 focus:ring-[#0b6b50]/20 focus:outline-none"
              >
                {uniqueExits.map((exit) => (
                  <option key={exit} value={exit}>
                    {exit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-[#2d4d40]">
                Operator Layanan
              </span>
              <div
                role="group"
                aria-label="Pilih operator layanan"
                className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#e7f0ec] p-1"
              >
                {availableOperators.map((op) => {
                  const isSelected = op === selectedOperator;
                  return (
                    <button
                      key={op}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onChangeOperator(op)}
                      className={`min-h-[38px] rounded-lg px-2 py-1.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0b6b50] sm:text-sm ${
                        isSelected
                          ? 'bg-[#0b6b50] text-white shadow-xs'
                          : 'text-[#244639] hover:bg-white/75'
                      }`}
                    >
                      {op}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3-Stage Stepper Navigation */}
          <nav aria-label="Tahapan panduan penumpang" className="mt-4">
            <ol className="grid grid-cols-3 gap-2">
              {[
                { step: 1, label: 'Panduan', target: 'panduan' as const },
                { step: 2, label: 'Rute', target: 'rute' as const },
                { step: 3, label: 'Cek Naik', target: 'cek' as const },
              ].map((item) => {
                const isActive = currentStepNumber === item.step;
                const isCompleted = currentStepNumber > item.step || screen === 'selesai';
                return (
                  <li key={item.step}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCheckValidationError(false);
                        setScreen(item.target);
                      }}
                      aria-current={isActive ? 'step' : undefined}
                      className={`flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-bold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0b6b50] ${
                        isActive
                          ? 'border-[#0b6b50] bg-[#0b6b50] text-white'
                          : isCompleted
                            ? 'border-[#b7dacb] bg-[#e9f5ef] text-[#08543f] hover:bg-[#dceee5]'
                            : 'border-[#d6e4de] bg-white text-[#4b685d] hover:bg-[#f1f7f4]'
                      }`}
                    >
                      <span
                        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : isCompleted
                              ? 'bg-[#0b6b50] text-white'
                              : 'bg-[#e6efeb] text-[#3c594e]'
                        }`}
                      >
                        {isCompleted && !isActive ? (
                          <Check className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          item.step
                        )}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Screen Body */}
        <div className="p-4 sm:p-5">
          {/* ================= LAYAR 1: PANDUAN ================= */}
          {screen === 'panduan' && (
            <section aria-labelledby="screen-panduan-title" className="space-y-4">
              <StatusBanner
                status={activePoint.statusVerifikasi}
                tanggalPemeriksaan={activePoint.tanggalPemeriksaan}
                sumberInformasi={activePoint.sumberInformasi}
              />

              <div>
                <p className="text-xs font-semibold text-[#0b6b50]">
                  Titik Temu {activePoint.operator}
                </p>
                <h2
                  id="screen-panduan-title"
                  className="mt-0.5 text-lg font-extrabold tracking-tight text-[#10241d]"
                >
                  {activePoint.namaTitikTemu}
                </h2>
              </div>

              {/* Kotak Peringatan Lokasi (border kiri oranye sesuai permintaan) */}
              <div
                role="note"
                className="rounded-r-xl rounded-l-sm border border-[#f5cca3] border-l-4 border-l-[#ea580c] bg-[#fff7ed] p-3.5 text-[#7c2d12]"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#ea580c]"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#9a3412]">Peringatan Lokasi</p>
                    <p className="text-xs leading-relaxed text-[#7c2d12] sm:text-[13px]">
                      {activePoint.pesanPeringatan}
                    </p>
                  </div>
                </div>
              </div>

              {/* Daftar bernomor 3 langkah singkat */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold tracking-tight text-[#2b493d]">
                  3 Langkah Singkat Sebelum Naik
                </h3>
                <ol className="space-y-2">
                  {[
                    {
                      num: 1,
                      title: 'Cek rute ke titik temu lebih dulu',
                      desc: 'Lihat skema jalur trotoar dan penanda A–B–C sebelum keluar ke tepi jalan.',
                    },
                    {
                      num: 2,
                      title: 'Pesan di aplikasi ojol & sepakati titik lewat chat',
                      desc: `Buka aplikasi ${activePoint.operator} dan kirim patokan "${activePoint.namaTitikTemu}" ke pengemudi.`,
                    },
                    {
                      num: 3,
                      title: 'Cocokkan kendaraan sebelum naik',
                      desc: 'Periksa pelat nomor, jenis & warna kendaraan, serta nama pengemudi.',
                    },
                  ].map((step) => (
                    <li
                      key={step.num}
                      className="flex items-start gap-3 rounded-xl border border-[#e3ede8] bg-[#fafcfb] p-3"
                    >
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0b6b50] text-xs font-bold text-white tabular-nums">
                        {step.num}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#10241d]">{step.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-[#466358]">
                          {step.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Primary & Secondary CTAs */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setScreen('rute')}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0b6b50] px-4 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#08543f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b6b50]"
                >
                  <span>Lihat peta &amp; penanda rute</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => openOjolFrom('panduan')}
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-[#b7d3c6] bg-white px-4 py-2.5 text-sm font-bold text-[#08543f] transition-colors hover:bg-[#eef6f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b6b50]"
                >
                  <Smartphone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Pilih &amp; buka aplikasi ojol</span>
                </button>
              </div>

              {/* Catatan kaki */}
              <p className="border-t border-[#e6efeb] pt-3 text-center text-[11px] leading-relaxed text-[#557267]">
                Halaman ini hanya panduan lokasi tanpa login, tanpa pemesanan otomatis, dan tanpa
                pengumpulan data pribadi penumpang.
              </p>
            </section>
          )}

          {/* ================= LAYAR 2: RUTE & PENANDA LOKASI ================= */}
          {screen === 'rute' && (
            <section aria-labelledby="screen-rute-title" className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setScreen('panduan')}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-[#0b6b50] transition-colors hover:bg-[#edf5f1]"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Kembali ke Panduan</span>
                </button>
                <span className="text-xs font-semibold text-[#4b685d]">
                  {activePoint.operator}
                </span>
              </div>

              <StatusBanner
                status={activePoint.statusVerifikasi}
                tanggalPemeriksaan={activePoint.tanggalPemeriksaan}
                sumberInformasi={activePoint.sumberInformasi}
                compact
              />

              <div>
                <h2
                  id="screen-rute-title"
                  className="text-base font-extrabold tracking-tight text-[#10241d]"
                >
                  Rute &amp; Penanda Lokasi
                </h2>
                <p className="mt-0.5 text-xs text-[#4b685d]">
                  Dari {activePoint.pintuKeluar} menuju {activePoint.namaTitikTemu}
                </p>
              </div>

              {/* Interactive Schematic SVG Map */}
              <SchematicMapSvg
                namaTitikTemu={activePoint.namaTitikTemu}
                pintuKeluar={activePoint.pintuKeluar}
                activeMarker={activeMarker}
                onSelectMarker={setActiveMarker}
              />

              {/* Synced 3 Marker Tabs (A, B, C) */}
              <div className="space-y-2.5">
                <div
                  role="tablist"
                  aria-label="Penanda rute pejalan kaki"
                  className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#ebf3ef] p-1"
                >
                  {markerTabMeta.map((tab) => {
                    const isSelected = activeMarker === tab.key;
                    const activeTabStyle =
                      tab.key === 'A'
                        ? 'bg-[#d97706] text-white shadow-xs'
                        : tab.key === 'B'
                          ? 'bg-[#0b6b50] text-white shadow-xs'
                          : 'bg-[#0f766e] text-white shadow-xs';
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setActiveMarker(tab.key)}
                        className={`min-h-[40px] rounded-lg px-2 py-1.5 text-[11px] font-bold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0b6b50] ${
                          isSelected
                            ? activeTabStyle
                            : 'text-[#28493c] hover:bg-white/75'
                        }`}
                      >
                        {tab.shortLabel}
                      </button>
                    );
                  })}
                </div>

                <div
                  role="tabpanel"
                  className={`rounded-xl border p-3.5 ${
                    activeMarker === 'A'
                      ? 'border-[#f3c677] bg-[#fffbf0]'
                      : activeMarker === 'B'
                        ? 'border-[#9ed5bc] bg-[#f2fbf6]'
                        : 'border-[#8ad8cf] bg-[#f0fbfa]'
                  }`}
                >
                  <p
                    className={`text-xs font-bold ${
                      activeMarker === 'A'
                        ? 'text-[#92400e]'
                        : activeMarker === 'B'
                          ? 'text-[#08543f]'
                          : 'text-[#115e59]'
                    }`}
                  >
                    {activeMarkerData.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#223c32] sm:text-[13px]">
                    {activeMarkerData.content}
                  </p>
                </div>
              </div>

              {/* Two compact summary cards side-by-side */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-[#d8e5df] bg-white p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4c695e]">
                    <Clock className="h-3.5 w-3.5 text-[#0b6b50]" aria-hidden="true" />
                    <span>Estimasi Jalan Kaki</span>
                  </div>
                  <p className="mt-1 text-xs font-bold leading-snug text-[#10241d]">
                    {activePoint.estimasiJalanKaki}
                  </p>
                </div>

                <div className="rounded-xl border border-[#d8e5df] bg-white p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4c695e]">
                    <MapPin className="h-3.5 w-3.5 text-[#0b6b50]" aria-hidden="true" />
                    <span>Status Lokasi</span>
                  </div>
                  <p
                    className={`mt-1 text-xs font-bold leading-snug ${
                      activePoint.statusVerifikasi === 'Terkonfirmasi'
                        ? 'text-[#0b6b50]'
                        : 'text-[#9a6700]'
                    }`}
                  >
                    {activePoint.statusVerifikasi === 'Terkonfirmasi'
                      ? 'Terkonfirmasi Lapangan'
                      : 'Simulasi Uji'}
                  </p>
                </div>
              </div>

              {/* Pedestrian Safety Note */}
              <div className="rounded-xl border border-[#d4e5dd] bg-[#f1f8f4] p-3.5">
                <div className="flex items-start gap-2.5">
                  <Footprints
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#0b6b50]"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#08543f]">
                      Catatan Keselamatan Pejalan Kaki
                    </p>
                    <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-[#2e4b40]">
                      <li>Gunakan jalur trotoar dan hindari berdiri di badan jalan kendaraan.</li>
                      <li>Waspadai sepeda motor yang parkir atau keluar-masuk area stasiun.</li>
                      <li>
                        Jangan ikuti arahan pihak tidak dikenal menuju lokasi sepi atau tidak aman.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => openOjolFrom('rute')}
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-[#b7d3c6] bg-white px-4 py-2.5 text-sm font-bold text-[#08543f] transition-colors hover:bg-[#eef6f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b6b50]"
                >
                  <Smartphone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Pilih &amp; buka aplikasi ojol</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowCheckValidationError(false);
                    setScreen('cek');
                  }}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0b6b50] px-4 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#08543f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b6b50]"
                >
                  <span>Sudah di titik temu? Cek kendaraan</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              </div>
            </section>
          )}

          {/* ================= LAYAR PILIH LAYANAN OJOL ================= */}
          {screen === 'ojol' && (
            <section aria-labelledby="screen-ojol-title" className="space-y-4">
              <button
                type="button"
                onClick={() => setScreen(ojolOrigin)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-[#0b6b50] transition-colors hover:bg-[#edf5f1]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>{ojolBackLabel}</span>
              </button>

              <div>
                <h2
                  id="screen-ojol-title"
                  className="text-lg font-extrabold tracking-tight text-[#10241d]"
                >
                  Pilih Layanan Ojol
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[#466358]">
                  Buka situs atau aplikasi resmi layanan pilihan Anda untuk memesan dan berkoordinasi
                  dengan pengemudi menuju{' '}
                  <span className="font-semibold text-[#10241d]">{activePoint.namaTitikTemu}</span>.
                </p>
              </div>

              <div className="space-y-2.5">
                {OPERATOR_FALLBACKS.map((service) => {
                  const isCurrentOperator = service.id === activePoint.operator;
                  return (
                    <a
                      key={service.id}
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex min-h-[68px] items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b6b50] ${
                        isCurrentOperator
                          ? 'border-[#0b6b50] bg-[#f2faf6] hover:bg-[#e7f5ee]'
                          : 'border-[#d6e4de] bg-white hover:bg-[#f6faf8]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-[#10241d]">
                            {service.name}
                          </span>
                          {isCurrentOperator && (
                            <span className="text-[11px] font-bold text-[#0b6b50]">
                              · Sedang dipilih
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs leading-snug text-[#49665b]">
                          {service.tagline}
                        </p>
                        <p className="mt-1 truncate font-mono text-[11px] text-[#5c786d]">
                          {service.url}
                        </p>
                      </div>
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b6b50] text-white">
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </a>
                  );
                })}
              </div>

              {/* Transparent fallback info box */}
              <div className="rounded-xl border border-[#cddfd6] bg-[#f4f8f6] p-3.5 text-[#27453a]">
                <div className="flex items-start gap-2.5">
                  <Info
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#0b6b50]"
                    aria-hidden="true"
                  />
                  <div className="space-y-1 text-xs leading-relaxed">
                    <p className="font-bold text-[#10241d]">Informasi Tautan Fallback</p>
                    <p>
                      Tombol di atas hanya merupakan tautan fallback menuju situs/layanan resmi
                      operator. Tautan ini <strong>tidak mengubah pin lokasi secara otomatis</strong>{' '}
                      dan <strong>tidak membuat pesanan otomatis</strong>. Pastikan Anda mengatur pin
                      jemput dan mengonfirmasi posisi langsung melalui chat aplikasi ojol.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCheckValidationError(false);
                  setScreen('cek');
                }}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0b6b50] px-4 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#08543f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b6b50]"
              >
                <span>Lanjut ke Cek Kendaraan</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>
            </section>
          )}

          {/* ================= LAYAR 3: CEK KENDARAAN SEBELUM NAIK ================= */}
          {screen === 'cek' && (
            <section aria-labelledby="screen-cek-title" className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setScreen('rute')}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-[#0b6b50] transition-colors hover:bg-[#edf5f1]"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Kembali ke Rute</span>
                </button>
                <span
                  data-testid="vehicle-check-progress"
                  className="font-mono text-xs font-bold text-[#08543f] tabular-nums"
                >
                  {checklistEval.checkedCount} / {checklistEval.total} dicentang
                </span>
              </div>

              <div>
                <h2
                  id="screen-cek-title"
                  className="text-lg font-extrabold tracking-tight text-[#10241d]"
                >
                  Cek Kendaraan Sebelum Naik
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[#466358]">
                  Centang seluruh 3 poin pemeriksaan berikut setelah kendaraan {activePoint.operator}{' '}
                  tiba di titik temu.
                </p>
              </div>

              {/* Progress Bar */}
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-[#e3eee8]"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-[#0b6b50] transition-all duration-200"
                  style={{
                    width: `${(checklistEval.checkedCount / checklistEval.total) * 100}%`,
                  }}
                />
              </div>

              {/* Real Validation Warning Message */}
              {showCheckValidationError && !checklistEval.isComplete && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#e79b9b] bg-[#fef2f2] p-3.5 text-[#881313]"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#dc2626]"
                      aria-hidden="true"
                    />
                    <div className="text-xs leading-relaxed">
                      <p className="font-bold">Pemeriksaan kendaraan belum lengkap.</p>
                      <p className="mt-0.5">
                        Masih ada {checklistEval.missingKeys.length} poin yang belum dicentang
                        (disorot merah di bawah). Pastikan semua sesuai sebelum berangkat.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3 Large Touch-Friendly Checkboxes */}
              <div className="space-y-2.5">
                {CHECK_ITEMS.map((item) => {
                  const checked = checks[item.key];
                  const isMissingHighlighted =
                    showCheckValidationError && !checked;
                  return (
                    <label
                      key={item.key}
                      className={`flex min-h-[72px] cursor-pointer items-start gap-3.5 rounded-xl border-2 p-3.5 transition-colors ${
                        checked
                          ? 'border-[#0b6b50] bg-[#eef8f3]'
                          : isMissingHighlighted
                            ? 'border-[#dc2626] bg-[#fef2f2]'
                            : 'border-[#d6e4de] bg-white hover:border-[#9ec4b3]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleCheck(item.key)}
                        className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer rounded border-[#9cb9ac] accent-[#0b6b50]"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-[#10241d]">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-[#48655a]">
                          {item.description}
                        </span>
                        {isMissingHighlighted && (
                          <span className="mt-1 block text-xs font-bold text-[#b91c1c]">
                            Wajib diperiksa dan dicentang terlebih dahulu.
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmVehicleReady}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0b6b50] px-4 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#08543f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b6b50]"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Semua cocok, saya siap berangkat</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowCheckValidationError(false);
                    setScreen('pemulihan');
                  }}
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[#dc2626] bg-white px-4 py-2.5 text-sm font-bold text-[#b91c1c] transition-colors hover:bg-[#fef2f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dc2626]"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Data tidak cocok / pengemudi tidak ada</span>
                </button>
              </div>
            </section>
          )}

          {/* ================= LAYAR KONFIRMASI SELESAI ================= */}
          {screen === 'selesai' && (
            <section aria-labelledby="screen-selesai-title" className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f6ee] text-[#0b6b50]">
                <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
              </div>

              <div>
                <h2
                  id="screen-selesai-title"
                  className="text-xl font-extrabold tracking-tight text-[#10241d]"
                >
                  Pemeriksaan Cocok — Siap Berangkat
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[#466358]">
                  Seluruh 3 poin verifikasi kendaraan telah dicentang. Selamat melanjutkan
                  perjalanan dengan aman.
                </p>
              </div>

              <div className="rounded-xl border border-[#cfe2d9] bg-[#f7fbf9] p-4 text-left">
                <p className="text-xs font-bold text-[#08543f]">Ringkasan Pemeriksaan</p>
                <dl className="mt-2.5 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-3 border-b border-[#e4eee9] pb-2">
                    <dt className="text-[#4c695e]">Operator Layanan</dt>
                    <dd className="text-right font-bold text-[#10241d]">{activePoint.operator}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3 border-b border-[#e4eee9] pb-2">
                    <dt className="text-[#4c695e]">Titik Temu</dt>
                    <dd className="text-right font-bold text-[#10241d]">
                      {activePoint.namaTitikTemu}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3 border-b border-[#e4eee9] pb-2">
                    <dt className="text-[#4c695e]">Status Data</dt>
                    <dd className="text-right font-bold text-[#10241d]">
                      {activePoint.statusVerifikasi} ({formatIndonesianDate(activePoint.tanggalPemeriksaan)})
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-[#4c695e]">Cek Kendaraan</dt>
                    <dd className="text-right font-bold text-[#0b6b50]">
                      3 / 3 cocok (Pelat, Jenis/Warna, Nama)
                    </dd>
                  </div>
                </dl>
              </div>

              <button
                type="button"
                onClick={handleResetSimulation}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0b6b50] px-4 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#08543f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b6b50]"
              >
                <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Ulangi simulasi dari awal</span>
              </button>
            </section>
          )}

          {/* ================= LAYAR PEMULIHAN AMAN (CABANG GAGAL) ================= */}
          {screen === 'pemulihan' && (
            <section aria-labelledby="screen-pemulihan-title" className="space-y-4">
              {/* Red Warning Banner */}
              <div
                role="alert"
                className="rounded-xl border border-[#dc2626] bg-[#fef2f2] p-4 text-[#7f1d1d]"
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert
                    className="mt-0.5 h-6 w-6 shrink-0 text-[#dc2626]"
                    aria-hidden="true"
                  />
                  <div>
                    <h2
                      id="screen-pemulihan-title"
                      className="text-base font-extrabold tracking-tight text-[#991b1b]"
                    >
                      Jangan naik kendaraan terlebih dahulu
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-[#7f1d1d]">
                      Jika pelat nomor, kendaraan, atau nama pengemudi tidak sesuai pesanan—atau
                      pengemudi belum berada di titik temu—tetap berdiri di area terang yang aman.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Numbered Recovery Steps */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-[#2b493d]">Langkah Pemulihan Aman</h3>
                <ol className="space-y-2">
                  {[
                    {
                      num: 1,
                      title: 'Periksa ulang detail pesanan di aplikasi',
                      desc: 'Cek kembali nomor pelat, jenis & warna kendaraan, nama pengemudi, serta titik jemput pada layar pesanan aktif.',
                    },
                    {
                      num: 2,
                      title: 'Hubungi pengemudi hanya melalui chat/telepon dalam aplikasi',
                      desc: 'Hindari berkomunikasi di luar aplikasi resmi dan kirim patokan singkat lokasi Anda berdiri.',
                    },
                    {
                      num: 3,
                      title: 'Utamakan keselamatan diri dan batalkan pesanan jika tetap tidak sesuai',
                      desc: 'Jangan memaksakan naik apabila identitas kendaraan atau pengemudi berbeda. Anda berhak membatalkan pesanan.',
                    },
                  ].map((step) => (
                    <li
                      key={step.num}
                      className="flex items-start gap-3 rounded-xl border border-[#f0d4d4] bg-[#fffafa] p-3"
                    >
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#b91c1c] text-xs font-bold text-white tabular-nums">
                        {step.num}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#10241d]">{step.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-[#4f5d57]">
                          {step.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 3 Recovery Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => openOjolFrom('pemulihan')}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0b6b50] px-4 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#08543f]"
                >
                  <Smartphone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Buka aplikasi ojol untuk chat pengemudi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScreen('rute')}
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-[#b7d3c6] bg-white px-4 py-2.5 text-sm font-bold text-[#08543f] transition-colors hover:bg-[#eef6f2]"
                >
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Lihat ulang peta rute</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowCheckValidationError(false);
                    setScreen('cek');
                  }}
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-[#d4e1db] bg-[#f6faf8] px-4 py-2.5 text-sm font-bold text-[#254539] transition-colors hover:bg-[#e9f2ee]"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Cek ulang kendaraan</span>
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
