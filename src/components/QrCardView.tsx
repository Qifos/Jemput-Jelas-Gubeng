import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  Printer,
  RotateCcw,
  Ruler,
  X,
} from 'lucide-react';
import { buildPublicPassengerUrl } from '../utils/pickupLogic';
import { generateQrMatrix } from '../utils/qrGenerator';

interface PrintableCardProps {
  url: string;
  svgPath: string;
  matrixSize: number;
  showGuides?: boolean;
  className?: string;
}

function A6QrCardSheet({
  url,
  svgPath,
  matrixSize,
  showGuides = false,
  className = '',
}: PrintableCardProps) {
  const quietZone = 3;
  const viewBoxSize = matrixSize + quietZone * 2;

  return (
    <div
      className={`print-a6-card relative flex aspect-[105/148] w-full flex-col justify-between overflow-hidden rounded-2xl border border-[#bfd5ca] bg-white p-6 text-[#10241d] shadow-sm ${className}`}
    >
      {/* Optional safe-margin guide overlay in print preview */}
      {showGuides && (
        <div
          aria-hidden="true"
          className="no-print pointer-events-none absolute inset-4 rounded-lg border border-dashed border-[#0b6b50]/45"
        />
      )}

      {/* Header Band */}
      <div className="space-y-1.5 text-center">
        <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#0b6b50] uppercase">
          Jemput Jelas Gubeng
        </p>
        <h3 className="text-lg font-extrabold leading-tight tracking-tight text-[#08543f]">
          Titik Jemput Ojek Online — Stasiun Gubeng Lama
        </h3>
        <p className="text-[11px] font-medium text-[#466358]">
          Pindai QR untuk panduan rute trotoar &amp; cek kendaraan sebelum naik
        </p>
      </div>

      {/* Crisp Scannable QR Code */}
      <div className="my-3 flex flex-col items-center">
        <div className="rounded-2xl border-2 border-[#0b6b50] bg-white p-3">
          <svg
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            className="h-44 w-44 sm:h-48 sm:w-48"
            shapeRendering="crispEdges"
            role="img"
            aria-label={`Kode QR menuju ${url}`}
            data-testid="qr-code-svg"
          >
            <rect x="0" y="0" width={viewBoxSize} height={viewBoxSize} fill="#ffffff" />
            <path
              d={svgPath}
              transform={`translate(${quietZone}, ${quietZone})`}
              fill="#0a1f18"
            />
          </svg>
        </div>

        {/* Fallback URL directly beneath QR */}
        <div className="mt-2.5 w-full rounded-lg border border-[#dbe7e1] bg-[#f6faf8] px-3 py-1.5 text-center">
          <p className="text-[10px] font-semibold text-[#4c695e]">Tautan cadangan:</p>
          <p className="mt-0.5 break-all font-mono text-[10px] font-semibold leading-snug text-[#10241d]">
            {url}
          </p>
        </div>
      </div>

      {/* Mandatory Honest Simulation Disclaimer Footer */}
      <div className="rounded-xl border border-[#e3c35c] bg-[#fff8dc] px-2.5 py-2 text-center">
        <p className="text-balance text-[10px] font-extrabold leading-snug tracking-wide text-[#6b4d00]">
          MATERI SIMULASI UJI — BUKAN PENGUMUMAN RESMI STASIUN
        </p>
      </div>
    </div>
  );
}

export function QrCardView() {
  const defaultUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'https://jemputjelasgubeng.example/?mode=penumpang';
    }
    return buildPublicPassengerUrl(
      window.location.protocol,
      window.location.origin,
      window.location.pathname,
    );
  }, []);

  const [publicUrl, setPublicUrl] = useState<string>(defaultUrl);
  const [copied, setCopied] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSafeGuides, setShowSafeGuides] = useState(true);

  const effectiveUrl = publicUrl.trim() || defaultUrl;

  const qrMatrix = useMemo(() => generateQrMatrix(effectiveUrl), [effectiveUrl]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(effectiveUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API may be restricted in non-HTTPS contexts
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="no-print mx-auto max-w-5xl space-y-6">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#10241d] sm:text-2xl">
            Kartu QR Siap Cetak (A6)
          </h2>
          <p className="mt-1 text-sm text-[#476459]">
            Buat kartu cetak ukuran A6 (105 × 148 mm) berisi kode QR valid yang langsung membuka
            Tampilan Penumpang bersih tanpa tab pengelola.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Controls Column */}
          <section
            aria-labelledby="qr-config-heading"
            className="space-y-4 rounded-2xl border border-[#d4e2dc] bg-white p-5 shadow-xs sm:p-6 lg:col-span-6"
          >
            <h3 id="qr-config-heading" className="text-base font-extrabold text-[#10241d]">
              Pengaturan Tautan &amp; Cetak
            </h3>

            <div>
              <label
                htmlFor="qr-public-url"
                className="mb-1.5 block text-xs font-bold text-[#1e3d31]"
              >
                URL Publik Tampilan Penumpang
              </label>
              <input
                id="qr-public-url"
                type="url"
                value={publicUrl}
                onChange={(e) => setPublicUrl(e.target.value)}
                placeholder="https://.../?mode=penumpang"
                className="w-full rounded-xl border border-[#c8dbd2] bg-white px-3.5 py-2.5 font-mono text-xs text-[#10241d] focus:border-[#0b6b50] focus:ring-2 focus:ring-[#0b6b50]/20 focus:outline-none"
              />
              <p className="mt-1.5 text-xs leading-relaxed text-[#4f6c61]">
                Otomatis terisi alamat halaman saat ini dengan parameter{' '}
                <code className="rounded bg-[#eef5f1] px-1 py-0.5 font-mono text-[11px] font-semibold text-[#08543f]">
                  ?mode=penumpang
                </code>
                . Anda dapat menggantinya dengan tautan publik saat sesi uji coba.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPublicUrl(defaultUrl)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#c8dbd2] bg-white px-3.5 py-2 text-xs font-bold text-[#254539] hover:bg-[#f2f6f4]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Gunakan URL Halaman Ini</span>
              </button>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#c8dbd2] bg-white px-3.5 py-2 text-xs font-bold text-[#254539] hover:bg-[#f2f6f4]"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#0b6b50]" aria-hidden="true" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Salin Tautan</span>
                  </>
                )}
              </button>

              <a
                href={effectiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#c8dbd2] bg-white px-3.5 py-2 text-xs font-bold text-[#0b6b50] hover:bg-[#edf6f2]"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Uji Mode Penumpang</span>
              </a>
            </div>

            <div className="rounded-xl border border-[#dce8e2] bg-[#f7faf8] p-4 text-xs leading-relaxed text-[#355448]">
              <p className="font-bold text-[#10241d]">Spesifikasi Standar Kartu A6</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4">
                <li>Ukuran kertas: A6 potret (105 mm × 148 mm), tanpa margin tambahan browser.</li>
                <li>Tingkat koreksi kesalahan QR: Level M (15%) agar tetap terbaca saat dicetak.</li>
                <li>
                  Aturan cetak <code className="font-mono">@media print</code> menyembunyikan seluruh
                  menu dan hanya mencetak kartu QR-nya saja.
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowPrintPreview(true)}
                className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#0b6b50] bg-white px-4 py-2.5 text-sm font-bold text-[#08543f] transition-colors hover:bg-[#eef6f2]"
              >
                <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Pratinjau Cetak (A6)</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b6b50] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#08543f]"
              >
                <Printer className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Cetak Kartu QR (A6)</span>
              </button>
            </div>
          </section>

          {/* Live A6 Preview Column */}
          <section
            aria-labelledby="qr-preview-heading"
            className="flex flex-col items-center lg:col-span-6"
          >
            <div className="mb-2.5 flex w-full max-w-[360px] items-center justify-between text-xs text-[#4a685c]">
              <h3 id="qr-preview-heading" className="font-bold text-[#10241d]">
                Pratinjau Kartu QR (A6)
              </h3>
              <span className="font-mono tabular-nums">105 × 148 mm</span>
            </div>

            <div className="w-full max-w-[360px]">
              <A6QrCardSheet
                url={effectiveUrl}
                svgPath={qrMatrix.svgPath}
                matrixSize={qrMatrix.size}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Print Preview Modal (Screen only) */}
      {showPrintPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="print-preview-modal-title"
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#0a1d16]/70 p-4 backdrop-blur-xs"
        >
          <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#cde0d7] bg-[#edf3f0] shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-[#d4e2dc] bg-white px-5 py-3.5">
              <div>
                <h3
                  id="print-preview-modal-title"
                  className="text-base font-extrabold text-[#10241d]"
                >
                  Pratinjau Cetak Standar A6 (105 × 148 mm)
                </h3>
                <p className="text-xs text-[#4b685d]">
                  Pastikan tata letak, kode QR, dan teks cadangan berada di dalam area aman cetak.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintPreview(false)}
                aria-label="Tutup pratinjau cetak"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#335246] hover:bg-[#eef4f1]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Paper sheet viewport */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mx-auto flex max-w-[355px] flex-col items-center">
                <div className="mb-2 flex w-full items-center justify-between font-mono text-[11px] text-[#426054]">
                  <span>← 105 mm →</span>
                  <span>Tinggi 148 mm</span>
                </div>

                <A6QrCardSheet
                  url={effectiveUrl}
                  svgPath={qrMatrix.svgPath}
                  matrixSize={qrMatrix.size}
                  showGuides={showSafeGuides}
                  className="shadow-lg"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d4e2dc] bg-white px-5 py-3.5">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#2a493d]">
                <input
                  type="checkbox"
                  checked={showSafeGuides}
                  onChange={(e) => setShowSafeGuides(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#0b6b50]"
                />
                <Ruler className="h-3.5 w-3.5 text-[#0b6b50]" aria-hidden="true" />
                <span>Tampilkan garis area aman</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="min-h-[42px] rounded-xl border border-[#c8dbd2] bg-white px-4 py-2 text-xs font-bold text-[#2a493d] hover:bg-[#f2f6f4]"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0b6b50] px-4 py-2 text-xs font-bold text-white hover:bg-[#08543f]"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  <span>Cetak Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden on screen, SOLE element printed via @media print */}
      <div className="print-only-root hidden">
        <A6QrCardSheet
          url={effectiveUrl}
          svgPath={qrMatrix.svgPath}
          matrixSize={qrMatrix.size}
        />
      </div>
    </>
  );
}
