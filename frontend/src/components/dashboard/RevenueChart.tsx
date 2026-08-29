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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(4); // Default to peak point

  const periods = ['7 Days', '30 Days', '90 Days', 'This Year'];

  // Default points if none provided
  const data = points.length > 0 ? points : [
    { label: '1 Jul', value: 1.4, formatted: '₹1.40L', calls: 5 },
    { label: '8 Jul', value: 2.2, formatted: '₹2.20L', calls: 9 },
    { label: '15 Jul', value: 2.6, formatted: '₹2.60L', calls: 11 },
    { label: '22 Jul', value: 3.8, formatted: '₹3.80L', calls: 18 },
    { label: '29 Jul', value: 5.62, formatted: '₹5.62L', calls: 28 },
  ];

  // SVG dimensions
  const width = 640;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  const maxValue = 6.0; // ₹6L ceiling
  const minValue = 0.0;

  // Calculate coordinates for points
  const coords = data.map((d, i) => {
    const x = paddingX + (i * (width - 2 * paddingX)) / (data.length - 1);
    const y = height - paddingY - ((d.value - minValue) / (maxValue - minValue)) * (height - 2 * paddingY);
    return { x, y, ...d };
  });

  // Construct smooth cubic bezier SVG path
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

  // Peak point index for tooltip badge
  const activePoint = hoveredIdx !== null && coords[hoveredIdx] ? coords[hoveredIdx] : coords[coords.length - 1];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
      {/* Header with Title and Period Dropdown */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Revenue Overview
        </h3>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition"
          >
            <span>{period}</span>
            <ChevronDown size={13} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-50">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p);
                      setDropdownOpen(false);
                      onPeriodChange?.(p);
                    }}
                    className={`w-full px-3 py-1.5 text-xs text-left font-medium transition ${
                      period === p
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden flex-1 flex flex-col justify-end pt-2">
        {/* Y-Axis Guidelines & Labels */}
        <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none pb-8 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-8">₹6L</span>
            <div className="flex-1 h-px border-b border-dashed border-slate-100 dark:border-slate-800/80" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8">₹4L</span>
            <div className="flex-1 h-px border-b border-dashed border-slate-100 dark:border-slate-800/80" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8">₹2L</span>
            <div className="flex-1 h-px border-b border-dashed border-slate-100 dark:border-slate-800/80" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8">₹0</span>
            <div className="flex-1 h-px border-b border-dashed border-slate-100 dark:border-slate-800/80" />
          </div>
        </div>

        {/* Interactive Floating Tooltip Pill (Styled exactly as in the image) */}
        {activePoint && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-150"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${(activePoint.y / height) * 100 - 8}%`,
            }}
          >
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-950 border border-blue-200 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 font-bold text-xs shadow-md shadow-blue-500/10 whitespace-nowrap">
              <span>{activePoint.formatted}</span>
              <ChevronDown size={11} className="text-blue-500" />
            </div>
          </div>
        )}

        {/* SVG Drawing */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 overflow-visible relative z-10"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={areaPath} fill="url(#revenueGradient)" />

          {/* Main Bezier Blue Curve Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Point Nodes */}
          {coords.map((pt, idx) => (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
            >
              {/* Outer halo */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIdx === idx ? '7' : '5'}
                className="fill-white dark:fill-slate-900 stroke-blue-600 transition-all duration-150"
                strokeWidth={hoveredIdx === idx ? '3.5' : '2.5'}
              />
              {/* Inner dot */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIdx === idx ? '3' : '2'}
                className="fill-blue-600"
              />
            </g>
          ))}
        </svg>

        {/* X-Axis Date Labels */}
        <div className="flex justify-between items-center px-6 pt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {data.map((d, i) => (
            <span
              key={i}
              className={`cursor-pointer transition-colors ${
                hoveredIdx === i ? 'text-blue-600 font-bold' : ''
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
