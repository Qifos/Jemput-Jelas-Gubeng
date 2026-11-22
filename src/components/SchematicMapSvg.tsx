import { KeyboardEvent } from 'react';
import { MapMarkerKey } from '../types';
import { getMapHighlightState } from '../utils/mapHighlight';
import { wrapLabelLines } from '../utils/pickupLogic';

interface SchematicMapSvgProps {
  namaTitikTemu: string;
  pintuKeluar: string;
  activeMarker: MapMarkerKey;
  onSelectMarker: (marker: MapMarkerKey) => void;
}

export function SchematicMapSvg({
  namaTitikTemu,
  pintuKeluar,
  activeMarker,
  onSelectMarker,
}: SchematicMapSvgProps) {
  const handleMarkerKeyDown = (
    event: KeyboardEvent<SVGGElement>,
    marker: MapMarkerKey,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectMarker(marker);
    }
  };

  const theme = getMapHighlightState(activeMarker);
  const destinationLines = wrapLabelLines(namaTitikTemu, 22, 2);
  const exitLines = wrapLabelLines(pintuKeluar, 22, 2);

  const markerCoords: Record<MapMarkerKey, { cx: number; cy: number; ariaLabel: string }> = {
    A: { cx: 103, cy: 128, ariaLabel: 'Titik A: Pintu Keluar' },
    B: { cx: 208, cy: 158, ariaLabel: 'Titik B: Jalur Trotoar' },
    C: { cx: 312, cy: 120, ariaLabel: 'Titik C: Titik Temu' },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#d1e0d9] bg-[#f8fbf9]">
      <div className="flex items-center justify-between gap-2 border-b border-[#e1ebe6] bg-white px-3.5 py-2 text-[11px] font-medium text-[#47665a]">
        <span>Skema Jalur Pejalan Kaki</span>
        <span
          data-testid="svg-active-indicator"
          className="font-mono text-[10px] font-bold"
          style={{ color: theme.badgeText }}
        >
          Sorotan: {theme.activeLabel}
        </span>
      </div>

      <svg
        viewBox="0 0 420 282"
        className="block h-auto w-full select-none"
        role="img"
        data-testid="schematic-route-svg"
        data-active-marker={activeMarker}
        aria-label={`Peta skematik rute jalan kaki dari ${pintuKeluar} menuju ${namaTitikTemu}. Titik aktif: ${theme.activeLabel}`}
      >
        <defs>
          <pattern
            id="road-hatch"
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="12" stroke="#d5dde2" strokeWidth="1.5" />
          </pattern>
        </defs>

        {/* Ground canvas */}
        <rect x="0" y="0" width="420" height="282" fill="#f5faf7" />

        {/* Subtle architectural grid lines */}
        <g stroke="#e4eee9" strokeWidth="1">
          <line x1="0" y1="68" x2="420" y2="68" />
          <line x1="0" y1="138" x2="420" y2="138" />
          <line x1="0" y1="208" x2="420" y2="208" />
          <line x1="105" y1="0" x2="105" y2="282" />
          <line x1="210" y1="0" x2="210" y2="282" />
          <line x1="315" y1="0" x2="315" y2="282" />
        </g>

        {/* Roadway area (bottom strip) */}
        <rect
          x="16"
          y="208"
          width="388"
          height="58"
          rx="10"
          fill="#e7edf0"
          stroke="#c8d4da"
          strokeWidth="1.2"
        />
        <rect
          x="16"
          y="208"
          width="388"
          height="58"
          rx="10"
          fill="url(#road-hatch)"
          opacity="0.45"
        />
        <line
          x1="32"
          y1="237"
          x2="388"
          y2="237"
          stroke="#9aaab3"
          strokeWidth="1.5"
          strokeDasharray="10 8"
        />
        <rect
          x="94"
          y="224"
          width="232"
          height="26"
          rx="6"
          fill="#fff1f1"
          stroke="#e5a3a3"
          strokeWidth="1"
        />
        <text
          x="210"
          y="241"
          textAnchor="middle"
          fill="#9f1d1d"
          fontSize="11"
          fontWeight="700"
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          Hindari menunggu di badan jalan
        </text>

        {/* Zone B: Interactive Pedestrian Sidewalk Corridor */}
        <g
          onClick={() => onSelectMarker('B')}
          className="cursor-pointer"
          data-testid="svg-zone-B"
          data-highlighted={activeMarker === 'B'}
        >
          {activeMarker === 'B' && (
            <path
              d="M 46 132 L 374 132 Q 394 132 394 152 L 394 182 Q 394 196 380 196 L 40 196 Q 26 196 26 182 L 26 152 Q 26 132 46 132 Z"
              fill="none"
              stroke="#10b981"
              strokeWidth="4"
              opacity="0.28"
            />
          )}
          <path
            d="M 48 136 L 372 136 Q 390 136 390 154 L 390 182 Q 390 194 378 194 L 42 194 Q 30 194 30 182 L 30 154 Q 30 136 48 136 Z"
            fill={theme.sidewalk.fill}
            stroke={theme.sidewalk.stroke}
            strokeWidth={theme.sidewalk.strokeWidth}
          />
          <text
            x="210"
            y="187"
            textAnchor="middle"
            fill={theme.sidewalk.labelFill}
            fontSize="9.8"
            fontWeight={activeMarker === 'B' ? '700' : '600'}
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            Jalur Trotoar Pejalan Kaki (Tetap di sisi dalam trotoar)
          </text>
        </g>

        {/* Zone A: Interactive Stasiun Gubeng Lama Block */}
        <g
          onClick={() => onSelectMarker('A')}
          className="cursor-pointer"
          opacity={theme.station.opacity}
          data-testid="svg-zone-A"
          data-highlighted={activeMarker === 'A'}
        >
          {activeMarker === 'A' && (
            <rect
              x="12"
              y="12"
              width="182"
              height="102"
              rx="15"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="4"
              opacity="0.3"
            />
          )}
          <rect
            x="16"
            y="16"
            width="174"
            height="94"
            rx="12"
            fill={theme.station.fill}
            stroke={theme.station.stroke}
            strokeWidth={theme.station.strokeWidth}
          />
          <text
            x="103"
            y="45"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="12"
            fontWeight="700"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            Stasiun Gubeng Lama
          </text>
          {exitLines.map((line, idx) => (
            <text
              key={`exit-${idx}`}
              x="103"
              y={63 + idx * 13}
              textAnchor="middle"
              fill={activeMarker === 'A' ? '#fef3c7' : '#bde5d5'}
              fontSize="9.5"
              fontWeight={activeMarker === 'A' ? '600' : '500'}
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              {line}
            </text>
          ))}
          <rect
            x="81"
            y="104"
            width="44"
            height="7"
            rx="3.5"
            fill={theme.station.doorFill}
          />
        </g>

        {/* Zone C: Interactive Destination Block */}
        <g
          onClick={() => onSelectMarker('C')}
          className="cursor-pointer"
          opacity={theme.destination.opacity}
          data-testid="svg-zone-C"
          data-highlighted={activeMarker === 'C'}
        >
          {activeMarker === 'C' && (
            <rect
              x="216"
              y="12"
              width="192"
              height="102"
              rx="15"
              fill="none"
              stroke="#14b8a6"
              strokeWidth="4"
              opacity="0.32"
            />
          )}
          <rect
            x="220"
            y="16"
            width="184"
            height="94"
            rx="12"
            fill={theme.destination.fill}
            stroke={theme.destination.stroke}
            strokeWidth={theme.destination.strokeWidth}
          />
          <line
            x1="234"
            y1="29"
            x2="390"
            y2="29"
            stroke={theme.destination.accentBar}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <text
            x="312"
            y="47"
            textAnchor="middle"
            fill={activeMarker === 'C' ? '#0f766e' : '#0b6b50'}
            fontSize="9.5"
            fontWeight="700"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            TITIK TEMU TUJUAN
          </text>
          {destinationLines.map((line, idx) => (
            <text
              key={`dest-${idx}`}
              x="312"
              y={65 + idx * 14}
              textAnchor="middle"
              fill="#10241d"
              fontSize="10.2"
              fontWeight="700"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              {line}
            </text>
          ))}
          <text
            x="312"
            y="96"
            textAnchor="middle"
            fill={activeMarker === 'C' ? '#115e59' : '#4a695d'}
            fontSize="8.8"
            fontWeight={activeMarker === 'C' ? '600' : '500'}
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            Konfirmasi posisi via chat ojol
          </text>
        </g>

        {/* Walking route segment A -> B */}
        <path
          d="M 103 128 L 103 158 L 208 158"
          fill="none"
          stroke={theme.segments.abStroke}
          strokeWidth={theme.segments.abWidth}
          strokeDasharray="7 5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 152 152 L 160 158 L 152 164"
          fill="none"
          stroke={theme.segments.abStroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Walking route segment B -> C */}
        <path
          d="M 208 158 L 312 158 L 312 120"
          fill="none"
          stroke={theme.segments.bcStroke}
          strokeWidth={theme.segments.bcWidth}
          strokeDasharray="7 5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 256 152 L 264 158 L 256 164"
          fill="none"
          stroke={theme.segments.bcStroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactive Points A, B, C with dynamic color & double-ring highlight */}
        {(['A', 'B', 'C'] as MapMarkerKey[]).map((key) => {
          const coord = markerCoords[key];
          const style = theme.markers[key];
          return (
            <g
              key={key}
              role="button"
              tabIndex={0}
              aria-label={coord.ariaLabel}
              aria-pressed={style.isActive}
              data-testid={`svg-marker-${key}`}
              data-active={style.isActive}
              onClick={() => onSelectMarker(key)}
              onKeyDown={(e) => handleMarkerKeyDown(e, key)}
              className="cursor-pointer focus:outline-none"
            >
              {style.isActive && (
                <>
                  <circle
                    cx={coord.cx}
                    cy={coord.cy}
                    r="25"
                    fill={style.haloFill}
                    opacity="0.18"
                  />
                  <circle
                    cx={coord.cx}
                    cy={coord.cy}
                    r="20"
                    fill="none"
                    stroke={style.haloFill}
                    strokeWidth="2"
                    opacity="0.7"
                  />
                </>
              )}
              <circle
                cx={coord.cx}
                cy={coord.cy}
                r={style.radius}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={style.isActive ? 2.8 : 2.2}
              />
              <text
                x={coord.cx}
                y={coord.cy + 4.5}
                textAnchor="middle"
                fill={style.textFill}
                fontSize={style.isActive ? '13.5' : '12'}
                fontWeight="800"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {key}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
