import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ChartPoint } from '../../types/call';

interface Props {
  points?: ChartPoint[];
  currentPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

export const RevenueChart: React.FC<Props> = ({
  points = [],
  currentPeriod = '30 Days',
  onPeriodChange,
}) => {
  const [period, setPeriod] = useState(currentPeriod);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(4);

  const periods = ['7 Days', '30 Days', '90 Days', 'This Year'];

  const data = points.length > 0 ? points : [
    { label: '1 Jul', value: 1.4, formatted: '₹1.40L', calls: 5 },
    { label: '8 Jul', value: 2.2, formatted: '₹2.20L', calls: 9 },
    { label: '15 Jul', value: 2.6, formatted: '₹2.60L', calls: 11 },
    { label: '22 Jul', value: 3.8, formatted: '₹3.80L', calls: 18 },
    { label: '29 Jul', value: 5.62, formatted: '₹5.62L', calls: 28 },
  ];

  const width = 600;
  const height = 190;
  const paddingX = 30;
  const paddingY = 24;

  const maxValue = 6.0;
  const minValue = 0.0;

  const coords = data.map((d, i) => {
    const x = paddingX + (i * (width - 2 * paddingX)) / (data.length - 1);
    const y = height - paddingY - ((d.value - minValue) / (maxValue - minValue)) * (height - 2 * paddingY);
    return { x, y, ...d };
  });

  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = buildSmoothPath(coords);
  const areaPath = coords.length > 0
    ? `${linePath} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`
    : '';

  const activePoint = hoveredIdx !== null && coords[hoveredIdx] ? coords[hoveredIdx] : coords[coords.length - 1];

  return (
    <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Volume &amp; Handled Value
          </h3>
          <span className="text-[11px] text-zinc-400 font-mono">
            {activePoint ? `${activePoint.formatted} across ${activePoint.calls} calls` : 'Real-time telemetry'}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <span>{period}</span>
            <ChevronDown size={11} className={`opacity-60 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-1 w-28 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md py-1 z-50">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p);
                      setDropdownOpen(false);
                      onPeriodChange?.(p);
                    }}
                    className={`w-full px-2.5 py-1 text-xs text-left font-mono transition ${
                      period === p
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden flex-1 flex flex-col justify-end pt-1">
        {/* Y-Axis Guidelines */}
        <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none pb-6 text-[10px] font-mono text-zinc-400/80">
          <div className="flex items-center gap-2">
            <span className="w-6">₹6L</span>
            <div className="flex-1 h-px border-b border-zinc-100 dark:border-zinc-800/60" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6">₹4L</span>
            <div className="flex-1 h-px border-b border-zinc-100 dark:border-zinc-800/60" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6">₹2L</span>
            <div className="flex-1 h-px border-b border-zinc-100 dark:border-zinc-800/60" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6">₹0</span>
            <div className="flex-1 h-px border-b border-zinc-100 dark:border-zinc-800/60" />
          </div>
        </div>

        {/* Minimal Tooltip Pill */}
        {activePoint && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-150"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${(activePoint.y / height) * 100 - 6}%`,
            }}
          >
            <div className="px-2 py-0.5 rounded bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 font-mono font-semibold text-[10px] shadow-sm">
              {activePoint.formatted}
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-40 overflow-visible relative z-10"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="minimalRevenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#minimalRevenueGradient)" />

          <path
            d={linePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {coords.map((pt, idx) => (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIdx === idx ? '5' : '3.5'}
                className="fill-white dark:fill-zinc-900 stroke-blue-600 transition-all duration-100"
                strokeWidth={hoveredIdx === idx ? '2.5' : '1.8'}
              />
            </g>
          ))}
        </svg>

        {/* X-Axis Date Labels */}
        <div className="flex justify-between items-center px-4 pt-1.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
          {data.map((d, i) => (
            <span
              key={i}
              className={`cursor-pointer transition-colors ${
                hoveredIdx === i ? 'text-zinc-900 dark:text-zinc-100 font-bold' : ''
              }`}
              onClick={() => setHoveredIdx(i)}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
