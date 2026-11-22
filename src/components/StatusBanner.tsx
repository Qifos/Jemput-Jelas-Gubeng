import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { VerificationStatus } from '../types';
import { formatIndonesianDate } from '../utils/pickupLogic';

interface StatusBannerProps {
  status: VerificationStatus;
  tanggalPemeriksaan: string;
  sumberInformasi: string;
  compact?: boolean;
}

export function StatusBanner({
  status,
  tanggalPemeriksaan,
  sumberInformasi,
  compact = false,
}: StatusBannerProps) {
  const formattedDate = formatIndonesianDate(tanggalPemeriksaan);

  if (status === 'Terkonfirmasi') {
    return (
      <div
        role="status"
        className={`rounded-xl border border-[#9fd3be] bg-[#e7f6ef] text-[#084c39] ${
          compact ? 'px-3.5 py-2.5' : 'px-4 py-3.5'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-[#0b6b50]"
            aria-hidden="true"
          />
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-bold tracking-tight text-[#084c39] sm:text-[13px]">
              STATUS: TERKONFIRMASI — Data titik jemput dan rute ini telah diperiksa di lapangan.
            </p>
            <p className="text-xs text-[#1d5e4a]">
              Terakhir diperiksa:{' '}
              <span className="font-mono font-medium tabular-nums">{formattedDate}</span>
              {' • '}Sumber: <span className="font-medium">{sumberInformasi}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className={`rounded-xl border border-[#e8cb6b] bg-[#fff9e6] text-[#5e4400] ${
        compact ? 'px-3.5 py-2.5' : 'px-4 py-3.5'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-[#b47b00]"
          aria-hidden="true"
        />
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-bold leading-relaxed text-[#5e4400] sm:text-[13px]">
            STATUS: SIMULASI UJI — Titik jemput, rute, dan waktu tempuh masih menunggu verifikasi
            lapangan serta konfirmasi resmi KAI/Daop 8 atau Dishub.
          </p>
          <p className="text-xs leading-snug text-[#785908]">
            Terakhir diperiksa:{' '}
            <span className="font-mono font-medium tabular-nums">{formattedDate}</span>
            {' • '}Sumber: <span className="font-medium">{sumberInformasi}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
