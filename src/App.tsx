import { useEffect, useMemo, useRef, useState } from 'react';
import { Cloud, HardDrive } from 'lucide-react';
import { ManageDataView } from './components/ManageDataView';
import { PassengerView } from './components/PassengerView';
import { QrCardView } from './components/QrCardView';
import { Toast } from './components/Toast';
import { TopBar } from './components/TopBar';
import {
  AppTab,
  OperatorId,
  PickupPointData,
  PickupPointFormInput,
} from './types';
import {
  createPickupPointApi,
  deletePickupPointApi,
  fetchPickupPoints,
  resetPickupPointsApi,
  StorageMode,
  updatePickupPointApi,
} from './utils/api';
import {
  findMatchingPoint,
  getOperatorsForExit,
  parsePassengerQueryParams,
  resolveInitialSelection,
} from './utils/pickupLogic';
import { loadPickupPoints, STORAGE_KEY } from './utils/storage';

export default function App() {
  const initialQuery = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isPassengerMode: false, pintu: null, operator: null };
    }
    return parsePassengerQueryParams(window.location.search);
  }, []);

  const isStandalonePassengerMode = initialQuery.isPassengerMode;

  const initialPoints = useMemo(() => loadPickupPoints(), []);
  const initialSelection = useMemo(
    () => resolveInitialSelection(initialPoints, initialQuery),
    [initialPoints, initialQuery],
  );

  const [activeTab, setActiveTab] = useState<AppTab>('penumpang');
  const [points, setPoints] = useState<PickupPointData[]>(initialPoints);
  const [storageMode, setStorageMode] = useState<StorageMode>('local');
  const [selectedExit, setSelectedExit] = useState<string>(initialSelection.selectedExit);
  const [selectedOperator, setSelectedOperator] = useState<OperatorId>(
    initialSelection.selectedOperator,
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const hasUserChangedSelectionRef = useRef(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Sync initial data from Express backend (with transparent localStorage fallback)
  useEffect(() => {
    let cancelled = false;
    fetchPickupPoints().then((res) => {
      if (cancelled) return;
      setPoints(res.items);
      setStorageMode(res.storageMode);
      if (!hasUserChangedSelectionRef.current) {
        const resolved = resolveInitialSelection(res.items, initialQuery);
        setSelectedExit(resolved.selectedExit);
        setSelectedOperator(resolved.selectedOperator);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialQuery]);

  // Cross-tab synchronization via window storage event
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const syncedPoints = loadPickupPoints();
      setPoints(syncedPoints);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const activePoint = useMemo(() => {
    return (
      findMatchingPoint(points, selectedExit, selectedOperator) ?? points[0]
    );
  }, [points, selectedExit, selectedOperator]);

  const handleChangeExit = (nextExit: string) => {
    hasUserChangedSelectionRef.current = true;
    setSelectedExit(nextExit);
    const availableOps = getOperatorsForExit(points, nextExit);
    if (availableOps.length > 0 && !availableOps.includes(selectedOperator)) {
      setSelectedOperator(availableOps[0]);
    }
  };

  const handleChangeOperator = (nextOp: OperatorId) => {
    hasUserChangedSelectionRef.current = true;
    setSelectedOperator(nextOp);
  };

  const handleSavePoint = async (
    input: PickupPointFormInput,
    editingId: string | null,
  ) => {
    const result = editingId
      ? await updatePickupPointApi(editingId, input, points)
      : await createPickupPointApi(input, points);

    setPoints(result.items);
    setStorageMode(result.storageMode);
    if (result.savedPoint) {
      hasUserChangedSelectionRef.current = true;
      setSelectedExit(result.savedPoint.pintuKeluar);
      setSelectedOperator(result.savedPoint.operator);
    }

    const label = result.savedPoint?.namaTitikTemu ?? input.namaTitikTemu;
    showToast(
      editingId
        ? `Perubahan titik "${label}" berhasil disimpan.`
        : `Data titik "${label}" berhasil ditambahkan.`,
    );
  };

  const handleDeletePoint = async (id: string) => {
    const target = points.find((p) => p.id === id);
    const result = await deletePickupPointApi(id, points);
    setPoints(result.items);
    setStorageMode(result.storageMode);

    const nextActive = findMatchingPoint(result.items, selectedExit, selectedOperator);
    if (nextActive) {
      setSelectedExit(nextActive.pintuKeluar);
      setSelectedOperator(nextActive.operator);
    }

    showToast(
      target
        ? `Data "${target.namaTitikTemu}" (${target.operator}) telah dihapus.`
        : 'Data titik jemput telah dihapus.',
    );
  };

  const handleResetDefaults = async () => {
    const result = await resetPickupPointsApi();
    setPoints(result.items);
    setStorageMode(result.storageMode);
    hasUserChangedSelectionRef.current = true;
    setSelectedExit(result.items[0].pintuKeluar);
    setSelectedOperator(result.items[0].operator);
    showToast('Data dikembalikan ke 3 data simulasi bawaan Stasiun Gubeng Lama.');
  };

  const handlePreviewInPassenger = (point: PickupPointData) => {
    hasUserChangedSelectionRef.current = true;
    setSelectedExit(point.pintuKeluar);
    setSelectedOperator(point.operator);
    setActiveTab('penumpang');
  };

  return (
    <div className="min-h-screen bg-[#f2f6f4] text-[#10241d]">
      {!isStandalonePassengerMode && (
        <TopBar activeTab={activeTab} onSelectTab={setActiveTab} />
      )}

      <main className="px-4 pt-5 pb-14 sm:px-6 sm:pt-7 sm:pb-16">
        {/* Compact Storage Sync Indicator */}
        <div
          className={`no-print mx-auto mb-4 flex items-center justify-end gap-1.5 text-[11px] font-semibold text-[#47665a] ${
            isStandalonePassengerMode || activeTab === 'penumpang'
              ? 'max-w-md'
              : activeTab === 'qr'
                ? 'max-w-5xl'
                : 'max-w-6xl'
          }`}
          data-testid="storage-mode-indicator"
          data-storage-mode={storageMode}
        >
          {storageMode === 'server' ? (
            <>
              <Cloud className="h-3.5 w-3.5 shrink-0 text-[#0b6b50]" aria-hidden="true" />
              <span className="text-[#08543f]">Tersinkronisasi Server</span>
            </>
          ) : (
            <>
              <HardDrive className="h-3.5 w-3.5 shrink-0 text-[#687f75]" aria-hidden="true" />
              <span>Mode Lokal Browser</span>
            </>
          )}
        </div>

        {isStandalonePassengerMode || activeTab === 'penumpang' ? (
          <PassengerView
            points={points}
            selectedExit={activePoint.pintuKeluar}
            selectedOperator={activePoint.operator}
            activePoint={activePoint}
            isStandaloneMode={isStandalonePassengerMode}
            onChangeExit={handleChangeExit}
            onChangeOperator={handleChangeOperator}
          />
        ) : activeTab === 'kelola' ? (
          <ManageDataView
            points={points}
            storageMode={storageMode}
            onSavePoint={handleSavePoint}
            onDeletePoint={handleDeletePoint}
            onResetDefaults={handleResetDefaults}
            onPreviewInPassenger={handlePreviewInPassenger}
          />
        ) : (
          <QrCardView points={points} />
        )}
      </main>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
