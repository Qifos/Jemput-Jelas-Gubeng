import { FormEvent, useState } from 'react';
import {
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { DEFAULT_ESTIMATE_LABEL, OPERATOR_LIST } from '../data/defaultPickupPoints';
import {
  FormFieldKey,
  FormValidationErrors,
  OperatorId,
  PickupPointData,
  PickupPointFormInput,
  VerificationStatus,
} from '../types';
import { ApiValidationError, StorageMode } from '../utils/api';
import {
  createEmptyFormInput,
  formatIndonesianDate,
  validatePickupPointForm,
} from '../utils/pickupLogic';

interface ManageDataViewProps {
  points: PickupPointData[];
  storageMode: StorageMode;
  onSavePoint: (input: PickupPointFormInput, editingId: string | null) => Promise<void>;
  onDeletePoint: (id: string) => Promise<void>;
  onResetDefaults: () => Promise<void>;
  onPreviewInPassenger: (point: PickupPointData) => void;
}

function getTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ManageDataView({
  points,
  storageMode,
  onSavePoint,
  onDeletePoint,
  onResetDefaults,
  onPreviewInPassenger,
}: ManageDataViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PickupPointFormInput>(() =>
    createEmptyFormInput(getTodayIso()),
  );
  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const updateField = <K extends FormFieldKey>(
    key: K,
    value: PickupPointFormInput[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSubmitError(null);
    if (errors[key] || ((key === 'pintuKeluar' || key === 'operator') && errors.pintuKeluar)) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        if (key === 'operator') {
          delete next.pintuKeluar;
        }
        return next;
      });
    }
  };

  const handleStartEdit = (point: PickupPointData) => {
    setEditingId(point.id);
    setForm({
      pintuKeluar: point.pintuKeluar,
      operator: point.operator,
      namaTitikTemu: point.namaTitikTemu,
      pesanPeringatan: point.pesanPeringatan,
      penandaA: point.penandaA,
      penandaB: point.penandaB,
      penandaC: point.penandaC,
      estimasiJalanKaki:
        point.estimasiJalanKaki === DEFAULT_ESTIMATE_LABEL
          ? ''
          : point.estimasiJalanKaki,
      statusVerifikasi: point.statusVerifikasi,
      sumberInformasi: point.sumberInformasi,
      tanggalPemeriksaan: point.tanggalPemeriksaan,
    });
    setErrors({});
    setSubmitError(null);
    setConfirmDeleteId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(createEmptyFormInput(getTodayIso()));
    setErrors({});
    setSubmitError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const validation = validatePickupPointForm(form, points, editingId ?? undefined);
    if (!validation.valid || !validation.sanitized) {
      setErrors(validation.errors);
      if (validation.duplicateError) {
        setSubmitError(validation.duplicateError);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onSavePoint(validation.sanitized, editingId);
      setEditingId(null);
      setForm(createEmptyFormInput(getTodayIso()));
      setErrors({});
      setSubmitError(null);
    } catch (err) {
      if (err instanceof ApiValidationError) {
        if (err.errors) {
          setErrors(err.errors);
        }
        setSubmitError(err.message);
      } else {
        setSubmitError('Gagal menyimpan data titik jemput. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    if (editingId === id) {
      handleCancelEdit();
    }
    setConfirmDeleteId(null);
    try {
      await onDeletePoint(id);
    } catch (err) {
      if (err instanceof ApiValidationError) {
        setSubmitError(err.message);
      }
    }
  };

  const handleConfirmReset = async () => {
    handleCancelEdit();
    setConfirmReset(false);
    setConfirmDeleteId(null);
    await onResetDefaults();
  };

  const inputBaseClass =
    'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#10241d] transition-colors focus:ring-2 focus:outline-none';

  const getFieldClass = (key: FormFieldKey) =>
    `${inputBaseClass} ${
      errors[key]
        ? 'border-[#dc2626] bg-[#fffafa] focus:border-[#dc2626] focus:ring-[#dc2626]/20'
        : 'border-[#c8dbd2] focus:border-[#0b6b50] focus:ring-[#0b6b50]/20'
    }`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#10241d] sm:text-2xl">
            Kelola Data Titik Jemput (MVP)
          </h2>
          <p className="mt-1 text-sm text-[#476459]">
            Tambahkan, ubah, atau verifikasi data titik temu per pintu keluar dan operator.{' '}
            {storageMode === 'server'
              ? 'Perubahan tersimpan di server bersama sehingga langsung terlihat lintas perangkat.'
              : 'Berjalan dalam mode lokal browser (localStorage) dan langsung memperbarui Tampilan Penumpang.'}
          </p>
        </div>

        <div className="shrink-0">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#c2d6cd] bg-white px-4 py-2 text-xs font-bold text-[#254539] transition-colors hover:bg-[#edf5f1]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Reset ke Data Bawaan</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-[#e8b4b4] bg-[#fff5f5] px-3 py-2">
              <span className="text-xs font-semibold text-[#881313]">
                Kembalikan 3 data awal?
              </span>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="min-h-[34px] rounded-lg bg-[#b91c1c] px-3 py-1 text-xs font-bold text-white hover:bg-[#991b1b]"
              >
                Ya, Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="min-h-[34px] rounded-lg border border-[#d6e4de] bg-white px-2.5 py-1 text-xs font-semibold text-[#314f43] hover:bg-[#f2f6f4]"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Responsive 2-Column Workspace */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Saved Data List */}
        <section
          aria-labelledby="saved-points-heading"
          className="space-y-3 lg:col-span-5"
        >
          <div className="flex items-center justify-between">
            <h3
              id="saved-points-heading"
              className="text-sm font-bold text-[#10241d]"
            >
              Daftar Titik Tersimpan
            </h3>
            <span className="font-mono text-xs font-semibold text-[#476459] tabular-nums">
              {points.length} data
            </span>
          </div>

          <div className="space-y-3">
            {points.map((point) => {
              const isBeingEdited = editingId === point.id;
              const isConfirmingDelete = confirmDeleteId === point.id;
              return (
                <article
                  key={point.id}
                  className={`rounded-2xl border bg-white p-4 shadow-xs transition-colors ${
                    isBeingEdited
                      ? 'border-[#0b6b50] ring-2 ring-[#0b6b50]/15'
                      : 'border-[#d6e4de]'
                  }`}
                >
                  {/* Clean unboxed metadata row */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#4b685d]">
                    <span className="font-bold text-[#0b6b50]">{point.operator}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={`font-bold ${
                        point.statusVerifikasi === 'Terkonfirmasi'
                          ? 'text-[#08543f]'
                          : 'text-[#9a6700]'
                      }`}
                    >
                      {point.statusVerifikasi}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatIndonesianDate(point.tanggalPemeriksaan)}
                    </span>
                  </div>

                  <h4 className="mt-1.5 text-base font-extrabold tracking-tight text-[#10241d]">
                    {point.namaTitikTemu}
                  </h4>
                  <p className="mt-0.5 text-xs font-medium text-[#3b594e]">
                    {point.pintuKeluar}
                  </p>

                  <dl className="mt-3 space-y-1 border-t border-[#ebf2ee] pt-2.5 text-xs text-[#466358]">
                    <div className="flex justify-between gap-2">
                      <dt className="shrink-0 text-[#5d796e]">Estimasi:</dt>
                      <dd className="text-right font-semibold text-[#10241d]">
                        {point.estimasiJalanKaki}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="shrink-0 text-[#5d796e]">Sumber:</dt>
                      <dd className="truncate text-right font-medium text-[#2c4a3e]">
                        {point.sumberInformasi}
                      </dd>
                    </div>
                  </dl>

                  {/* Actions */}
                  {isConfirmingDelete ? (
                    <div className="mt-3.5 flex items-center justify-between gap-2 rounded-xl border border-[#efb7b7] bg-[#fff5f5] px-3 py-2">
                      <span className="text-xs font-semibold text-[#881313]">
                        Hapus data ini?
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(point.id)}
                          className="min-h-[34px] rounded-lg bg-[#b91c1c] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#991b1b]"
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[34px] rounded-lg border border-[#d6e4de] bg-white px-2.5 py-1 text-xs font-semibold text-[#314f43]"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-[#ebf2ee] pt-3">
                      <button
                        type="button"
                        onClick={() => onPreviewInPassenger(point)}
                        aria-label={`Lihat di Tampilan Penumpang: ${point.operator} ${point.namaTitikTemu}`}
                        className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#eef6f2] px-3 py-1.5 text-xs font-bold whitespace-nowrap text-[#08543f] transition-colors hover:bg-[#dceee5]"
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Lihat di Tampilan Penumpang</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(point)}
                        aria-label={`Edit ${point.operator} ${point.namaTitikTemu}`}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#c7dbd2] bg-white px-3 py-1.5 text-xs font-bold text-[#1d3e31] transition-colors hover:bg-[#f2f7f5]"
                      >
                        <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        disabled={points.length <= 1}
                        onClick={() => setConfirmDeleteId(point.id)}
                        aria-label={`Hapus ${point.operator} ${point.namaTitikTemu}`}
                        title={
                          points.length <= 1
                            ? 'Minimal harus tersisa 1 data titik jemput'
                            : 'Hapus data titik jemput'
                        }
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#efc4c4] bg-white px-3 py-1.5 text-xs font-bold text-[#b91c1c] transition-colors hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* Right Column: Add / Edit Form */}
        <section
          aria-labelledby="form-point-heading"
          className="rounded-2xl border border-[#d4e2dc] bg-white p-5 shadow-xs sm:p-6 lg:col-span-7"
        >
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#e7f0ec] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#e9f5ef] text-[#0b6b50]">
                {editingId ? (
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              <div>
                <h3
                  id="form-point-heading"
                  className="text-base font-extrabold text-[#10241d]"
                >
                  {editingId ? 'Edit Data Titik Jemput' : 'Tambah / Edit Data Titik Jemput'}
                </h3>
                <p className="text-xs text-[#4e6c60]">
                  Kolom bertanda * wajib diisi minimal 3 karakter.
                </p>
              </div>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[#d1e0d9] px-3 py-1.5 text-xs font-bold text-[#3c594e] hover:bg-[#f2f6f4]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Batal Edit</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {submitError && (
              <div
                role="alert"
                data-testid="form-duplicate-alert"
                className="rounded-xl border border-[#e79b9b] bg-[#fef2f2] px-3.5 py-3 text-xs font-semibold leading-relaxed text-[#991b1b]"
              >
                {submitError}
              </div>
            )}

            {/* Row 1: Pintu Keluar & Operator */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="field-pintuKeluar"
                  className="mb-1.5 block text-xs font-bold text-[#1e3d31]"
                >
                  1. Pintu Keluar *
                </label>
                <input
                  id="field-pintuKeluar"
                  type="text"
                  value={form.pintuKeluar}
                  onChange={(e) => updateField('pintuKeluar', e.target.value)}
                  placeholder="Contoh: Pintu Keluar Stasiun Gubeng Lama"
                  aria-invalid={Boolean(errors.pintuKeluar)}
                  className={getFieldClass('pintuKeluar')}
                />
                {errors.pintuKeluar && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-[#dc2626]">
                    {errors.pintuKeluar}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="field-operator"
                  className="mb-1.5 block text-xs font-bold text-[#1e3d31]"
                >
                  2. Operator / Layanan *
                </label>
                <select
                  id="field-operator"
                  value={form.operator}
                  onChange={(e) => updateField('operator', e.target.value as OperatorId)}
                  aria-invalid={Boolean(errors.operator)}
                  className={getFieldClass('operator')}
                >
                  {OPERATOR_LIST.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
                {errors.operator && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-[#dc2626]">
                    {errors.operator}
                  </p>
                )}
              </div>
            </div>

            {/* 3. Nama Titik Temu */}
            <div>
              <label
                htmlFor="field-namaTitikTemu"
                className="mb-1.5 block text-xs font-bold text-[#1e3d31]"
              >
                3. Nama Titik Temu *
              </label>
              <input
                id="field-namaTitikTemu"
                type="text"
                value={form.namaTitikTemu}
                onChange={(e) => updateField('namaTitikTemu', e.target.value)}
                placeholder="Contoh: Area Bawah Jembatan Gubeng (Simulasi)"
                aria-invalid={Boolean(errors.namaTitikTemu)}
                className={getFieldClass('namaTitikTemu')}
              />
              {errors.namaTitikTemu && (
                <p role="alert" className="mt-1 text-xs font-semibold text-[#dc2626]">
                  {errors.namaTitikTemu}
                </p>
              )}
            </div>

            {/* 4. Pesan Peringatan Lokasi */}
            <div>
              <label
                htmlFor="field-pesanPeringatan"
                className="mb-1.5 block text-xs font-bold text-[#1e3d31]"
              >
                4. Pesan Peringatan Lokasi *
              </label>
              <textarea
                id="field-pesanPeringatan"
                rows={3}
                value={form.pesanPeringatan}
                onChange={(e) => updateField('pesanPeringatan', e.target.value)}
                placeholder="Peringatan penting agar penumpang tidak menunggu di depan pintu keluar atau badan jalan..."
                aria-invalid={Boolean(errors.pesanPeringatan)}
                className={getFieldClass('pesanPeringatan')}
              />
              {errors.pesanPeringatan && (
                <p role="alert" className="mt-1 text-xs font-semibold text-[#dc2626]">
                  {errors.pesanPeringatan}
                </p>
              )}
            </div>

            {/* 5, 6, 7: Penanda A, B, C */}
            <div className="space-y-3 rounded-xl border border-[#e3ede8] bg-[#f8fbf9] p-4">
              <p className="text-xs font-bold text-[#08543f]">
                Penanda Rute Pejalan Kaki (Sinkron dengan Peta SVG)
              </p>

              <div>
                <label
                  htmlFor="field-penandaA"
                  className="mb-1 block text-xs font-bold text-[#1e3d31]"
                >
                  5. Penanda A — Area Awal *
                </label>
                <textarea
                  id="field-penandaA"
                  rows={2}
                  value={form.penandaA}
                  onChange={(e) => updateField('penandaA', e.target.value)}
                  placeholder="Arahan singkat saat baru melangkah keluar dari pintu stasiun..."
                  aria-invalid={Boolean(errors.penandaA)}
                  className={getFieldClass('penandaA')}
                />
                {errors.penandaA && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-[#dc2626]">
                    {errors.penandaA}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="field-penandaB"
                  className="mb-1 block text-xs font-bold text-[#1e3d31]"
                >
                  6. Penanda B — Jalur / Landmark Tengah *
                </label>
                <textarea
                  id="field-penandaB"
                  rows={2}
                  value={form.penandaB}
                  onChange={(e) => updateField('penandaB', e.target.value)}
                  placeholder="Patokan jalur trotoar atau penanda tengah menuju titik temu..."
                  aria-invalid={Boolean(errors.penandaB)}
                  className={getFieldClass('penandaB')}
                />
                {errors.penandaB && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-[#dc2626]">
                    {errors.penandaB}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="field-penandaC"
                  className="mb-1 block text-xs font-bold text-[#1e3d31]"
                >
                  7. Penanda C — Deskripsi Titik Temu *
                </label>
                <textarea
                  id="field-penandaC"
                  rows={2}
                  value={form.penandaC}
                  onChange={(e) => updateField('penandaC', e.target.value)}
                  placeholder="Ciri lokasi titik temu dan area aman menunggu kendaraan..."
                  aria-invalid={Boolean(errors.penandaC)}
                  className={getFieldClass('penandaC')}
                />
                {errors.penandaC && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-[#dc2626]">
                    {errors.penandaC}
                  </p>
                )}
              </div>
            </div>

            {/* 8 & 9: Estimasi & Status Verifikasi */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="field-estimasiJalanKaki"
                  className="mb-1.5 block text-xs font-bold text-[#1e3d31]"
                >
                  8. Estimasi Waktu Jalan Kaki (Opsional)
                </label>
                <input
                  id="field-estimasiJalanKaki"
                  type="text"
                  value={form.estimasiJalanKaki}
                  onChange={(e) => updateField('estimasiJalanKaki', e.target.value)}
                  placeholder="Kosongkan → Menunggu uji dry run"
                  className={getFieldClass('estimasiJalanKaki')}
                />
                <p className="mt-1 text-[11px] text-[#557267]">
                  Jika dikosongkan otomatis terisi &ldquo;Menunggu uji dry run&rdquo;.
                </p>
              </div>

              <div>
                <label
                  htmlFor="field-statusVerifikasi"
                  className="mb-1.5 block text-xs font-bold text-[#1e3d31]"
                >
                  9. Status Verifikasi *
                </label>
                <select
                  id="field-statusVerifikasi"
                  value={form.statusVerifikasi}
                  onChange={(e) =>
                    updateField('statusVerifikasi', e.target.value as VerificationStatus)
                  }
                  aria-invalid={Boolean(errors.statusVerifikasi)}
                  className={getFieldClass('statusVerifikasi')}
                >
                  <option value="Simulasi">Simulasi</option>
                  <option value="Terkonfirmasi">Terkonfirmasi</option>
                </select>
                {errors.statusVerifikasi && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-[#dc2626]">
                    {errors.statusVerifikasi}
                  </p>
                )}
              </div>
            </div>

            {/* 10 & 11: Sumber Informasi & Tanggal Pemeriksaan */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="field-sumberInformasi"
                  className="mb-1.5 block text-xs font-bold text-[#1e3d31]"
                >
                  10. Sumber Informasi / Penanggung Jawab *
                </label>
                <input
                  id="field-sumberInformasi"
                  type="text"
                  value={form.sumberInformasi}
                  onChange={(e) => updateField('sumberInformasi', e.target.value)}
                  placeholder="Mis. Tim Uji / Survei Lapangan"
                  aria-invalid={Boolean(errors.sumberInformasi)}
                  className={getFieldClass('sumberInformasi')}
                />
                {errors.sumberInformasi && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-[#dc2626]">
                    {errors.sumberInformasi}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="field-tanggalPemeriksaan"
                  className="mb-1.5 block text-xs font-bold text-[#1e3d31]"
                >
                  11. Tanggal Pemeriksaan *
                </label>
                <input
                  id="field-tanggalPemeriksaan"
                  type="date"
                  value={form.tanggalPemeriksaan}
                  onChange={(e) => updateField('tanggalPemeriksaan', e.target.value)}
                  aria-invalid={Boolean(errors.tanggalPemeriksaan)}
                  className={getFieldClass('tanggalPemeriksaan')}
                />
                {errors.tanggalPemeriksaan && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-[#dc2626]">
                    {errors.tanggalPemeriksaan}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-[#e7f0ec] pt-4">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="min-h-[44px] rounded-xl border border-[#c8dbd2] bg-white px-4 py-2 text-sm font-bold text-[#2b493d] hover:bg-[#f2f6f4]"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#0b6b50] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#08543f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b6b50] disabled:opacity-60"
              >
                <Save className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {isSubmitting
                    ? 'Menyimpan...'
                    : editingId
                      ? 'Simpan Perubahan'
                      : 'Simpan Data Titik'}
                </span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
