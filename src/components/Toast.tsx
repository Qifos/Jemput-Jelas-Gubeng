import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print fixed top-20 right-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-[#8ac7af] bg-[#08543f] px-4 py-3 text-sm font-medium text-white shadow-lg"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 text-[#86efac]" aria-hidden="true" />
      <span className="leading-snug">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Tutup notifikasi"
        className="ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
