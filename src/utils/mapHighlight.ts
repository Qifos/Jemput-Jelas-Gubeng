import { MapMarkerKey } from '../types';

export interface MapHighlightState {
  activeMarker: MapMarkerKey;
  activeLabel: string;
  badgeFill: string;
  badgeStroke: string;
  badgeText: string;
  station: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    doorFill: string;
    opacity: number;
  };
  sidewalk: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    labelFill: string;
  };
  destination: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    accentBar: string;
    opacity: number;
  };
  segments: {
    abStroke: string;
    abWidth: number;
    bcStroke: string;
    bcWidth: number;
  };
  markers: Record<
    MapMarkerKey,
    {
      isActive: boolean;
      fill: string;
      stroke: string;
      textFill: string;
      haloFill: string;
      radius: number;
    }
  >;
}

const MARKER_META: Record<
  MapMarkerKey,
  {
    label: string;
    activeFill: string;
    activeStroke: string;
    haloFill: string;
    badgeFill: string;
    badgeStroke: string;
    badgeText: string;
  }
> = {
  A: {
    label: 'A · Pintu Keluar',
    activeFill: '#d97706',
    activeStroke: '#92400e',
    haloFill: '#f59e0b',
    badgeFill: '#fef3c7',
    badgeStroke: '#d97706',
    badgeText: '#92400e',
  },
  B: {
    label: 'B · Jalur Trotoar',
    activeFill: '#0b6b50',
    activeStroke: '#064030',
    haloFill: '#10b981',
    badgeFill: '#d1fae5',
    badgeStroke: '#0b6b50',
    badgeText: '#064e3b',
  },
  C: {
    label: 'C · Titik Temu',
    activeFill: '#0f766e',
    activeStroke: '#115e59',
    haloFill: '#14b8a6',
    badgeFill: '#ccfbf1',
    badgeStroke: '#0f766e',
    badgeText: '#115e59',
  },
};

export function getMapHighlightState(activeMarker: MapMarkerKey): MapHighlightState {
  const meta = MARKER_META[activeMarker];

  const buildMarker = (key: MapMarkerKey) => {
    const isActive = key === activeMarker;
    const keyMeta = MARKER_META[key];
    return {
      isActive,
      fill: isActive ? keyMeta.activeFill : '#ffffff',
      stroke: isActive ? keyMeta.activeStroke : '#0b6b50',
      textFill: isActive ? '#ffffff' : '#08543f',
      haloFill: keyMeta.haloFill,
      radius: isActive ? 16 : 13.5,
    };
  };

  return {
    activeMarker,
    activeLabel: meta.label,
    badgeFill: meta.badgeFill,
    badgeStroke: meta.badgeStroke,
    badgeText: meta.badgeText,
    station: {
      fill: activeMarker === 'A' ? '#0b6b50' : '#185443',
      stroke: activeMarker === 'A' ? '#f59e0b' : '#0b3d2f',
      strokeWidth: activeMarker === 'A' ? 3 : 1.5,
      doorFill: activeMarker === 'A' ? '#fbbf24' : '#e6cf8b',
      opacity: activeMarker === 'A' ? 1 : 0.88,
    },
    sidewalk: {
      fill: activeMarker === 'B' ? '#b8ebd3' : '#def3e8',
      stroke: activeMarker === 'B' ? '#0b6b50' : '#96ceb5',
      strokeWidth: activeMarker === 'B' ? 2.6 : 1.3,
      labelFill: activeMarker === 'B' ? '#064e3b' : '#256c54',
    },
    destination: {
      fill: activeMarker === 'C' ? '#e3f7f2' : '#ffffff',
      stroke: activeMarker === 'C' ? '#0f766e' : '#85b8a4',
      strokeWidth: activeMarker === 'C' ? 3 : 1.8,
      accentBar: activeMarker === 'C' ? '#14b8a6' : '#d1e7dc',
      opacity: activeMarker === 'C' ? 1 : 0.92,
    },
    segments: {
      abStroke: activeMarker === 'A' ? '#d97706' : activeMarker === 'B' ? '#0b6b50' : '#6aa690',
      abWidth: activeMarker === 'A' || activeMarker === 'B' ? 4 : 3,
      bcStroke: activeMarker === 'C' ? '#0f766e' : activeMarker === 'B' ? '#0b6b50' : '#6aa690',
      bcWidth: activeMarker === 'C' || activeMarker === 'B' ? 4 : 3,
    },
    markers: {
      A: buildMarker('A'),
      B: buildMarker('B'),
      C: buildMarker('C'),
    },
  };
}
