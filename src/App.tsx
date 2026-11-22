import { useEffect, useMemo, useState } from 'react';
import { ManageDataView } from './components/ManageDataView';
import { PassengerView } from './components/PassengerView';
import { QrCardView } from './components/QrCardView';
import { Toast } from './components/Toast';
import { TopBar } from './components/TopBar';
import { AppTab, OperatorId, PickupPointData } from './types';
import {
  findMatchingPoint,
  getOperatorsForExit,
  isPassengerModeFromSearch,
} from './utils/pickupLogic';
import {
  loadPickupPoints,
  resetPickupPointsToDefault,
  savePickupPoints,
} from './utils/storage';

export default function App() {
  const isStandalonePassengerMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return isPassengerModeFromSearch(window.location.search);
  }, []);

  const [activeTab, setActiveTab] = useState<AppTab>('penumpang');
  const [points, setPoints] = useState<PickupPointData[]>(() => loadPickupPoints());
  const [selectedExit, setSelectedExit] = useState<string>(
    () => loadPickupPoints()[0].pintuKeluar,
  );
  const [selectedOperator, setSelectedOperator] = useState<OperatorId>(
    () => loadPickupPoints()[0].operator,
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

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
    setSelectedExit(nextExit);
    const availableOps = getOperatorsForExit(points, nextExit);
    if (availableOps.length > 0 && !availableOps.includes(selectedOperator)) {
      setSelectedOperator(availableOps[0]);
    }
  };

  const handleChangeOperator = (nextOp: OperatorId) => {
    setSelectedOperator(nextOp);
  };

  const handleSavePoint = (savedPoint: PickupPointData, isEditing: boolean) => {
    const nextPoints = isEditing
      ? points.map((p) => (p.id === savedPoint.id ? savedPoint : p))
      : [...points, savedPoint];

    setPoints(nextPoints);
    savePickupPoints(nextPoints);
    setSelectedExit(savedPoint.pintuKeluar);
    setSelectedOperator(savedPoint.operator);
    showToast(
      isEditing
        ? `Perubahan titik "${savedPoint.namaTitikTemu}" berhasil disimpan.`
        : `Data titik "${savedPoint.namaTitikTemu}" berhasil ditambahkan.`,
    );
  };

  const handleDeletePoint = (id: string) => {
    if (points.length <= 1) return;
    const target = points.find((p) => p.id === id);
    const nextPoints = points.filter((p) => p.id !== id);
    setPoints(nextPoints);
    savePickupPoints(nextPoints);

    const nextActive = findMatchingPoint(nextPoints, selectedExit, selectedOperator);
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

  const handleResetDefaults = () => {
    const defaults = resetPickupPointsToDefault();
    setPoints(defaults);
    setSelectedExit(defaults[0].pintuKeluar);
    setSelectedOperator(defaults[0].operator);
    showToast('Data dikembalikan ke 3 data simulasi bawaan Stasiun Gubeng Lama.');
  };

  const handlePreviewInPassenger = (point: PickupPointData) => {
    setSelectedExit(point.pintuKeluar);
    setSelectedOperator(point.operator);
    setActiveTab('penumpang');
  };

  return (
    <div className="min-h-screen bg-[#f2f6f4] text-[#10241d]">
      {!isStandalonePassengerMode && (
        <TopBar activeTab={activeTab} onSelectTab={setActiveTab} />
      )}

      <main className="px-4 pt-6 pb-14 sm:px-6 sm:pt-8 sm:pb-16">
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
            onSavePoint={handleSavePoint}
            onDeletePoint={handleDeletePoint}
            onResetDefaults={handleResetDefaults}
            onPreviewInPassenger={handlePreviewInPassenger}
          />
        ) : (
          <QrCardView />
        )}
      </main>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
