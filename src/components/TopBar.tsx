import { Database, QrCode, Smartphone } from 'lucide-react';
import { AppTab } from '../types';

interface TopBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

const TABS: Array<{ id: AppTab; label: string; icon: typeof Smartphone }> = [
  { id: 'penumpang', label: 'Tampilan Penumpang', icon: Smartphone },
  { id: 'kelola', label: 'Kelola Data Titik (MVP)', icon: Database },
  { id: 'qr', label: 'Kartu QR (A6)', icon: QrCode },
];

export function TopBar({ activeTab, onSelectTab }: TopBarProps) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-[#d5e2dc] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-tight text-[#08543f] sm:text-lg">
            Jemput Jelas Gubeng — Stasiun Gubeng Lama, Surabaya
          </h1>
        </div>

        <nav
          aria-label="Navigasi utama"
          role="tablist"
          className="flex items-center gap-1 overflow-x-auto rounded-xl bg-[#eef4f1] p-1"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectTab(tab.id)}
                className={`inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b6b50] sm:text-sm ${
                  isActive
                    ? 'bg-[#0b6b50] text-white shadow-xs'
                    : 'text-[#2b4a3e] hover:bg-white/70 hover:text-[#08543f]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
