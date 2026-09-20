import { useId, useMemo, useState } from 'react';
import { formatCompactCurrency, formatNumber, formatDate } from '@/lib/format';

/**
 * Hand-built SVG charts. A charting dependency would add ~120KB for four
 * shapes; these stay on-brand, scale with the container and read correctly
 * on a phone.
 */
const palette = ['#1B39C9', '#0E7A5F', '#B45309', '#7A5AF8', '#0E7490', '#C02B52'];

export function AreaChart({ data = [], xKey = 'date', yKey = 'revenue', height = 260, valueFormat = formatCompactCurrency }) {
  const gradientId = useId();
  const [hover, setHover] = useState(null);
  const W = 720, H = height, pad = { t: 16, r: 12, b: 28, l: 52 };

  const { path, area, points, ticks, max } = useMemo(() => {
    if (!data.length) return { path: '', area: '', points: [], ticks: [], max: 0 };
    const max = Math.max(...data.map((d) => d[yKey]), 1) * 1.15;
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const pts = data.map((d, i) => ({
      x: pad.l + (i / Math.max(data.length - 1, 1)) * iw,
      y: pad.t + ih - (d[yKey] / max) * ih,
      d,
    }));
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    return {
      path: line,
      area: `${line} L${pts.at(-1).x.toFixed(1)},${pad.t + ih} L${pts[0].x.toFixed(1)},${pad.t + ih} Z`,
      points: pts,
      ticks: [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: max * f, y: pad.t + ih - f * ih })),
      max,
    };
  }, [data, yKey, height]);

  if (!data.length) return <ChartEmpty height={height} />;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img" aria-label="Revenue over time"
        onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B39C9" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#1B39C9" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={t.y} y2={t.y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray={i ? '0' : '0'} />
            <text x={pad.l - 8} y={t.y + 4} textAnchor="end" fontSize="11" fill="#6B7280">{valueFormat(t.v)}</text>
          </g>
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke="#1B39C9" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.filter((_, i) => i % Math.ceil(points.length / 6) === 0).map((p, i) => (
          <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize="11" fill="#6B7280">
            {formatDate(p.d[xKey], { year: undefined })}
          </text>
        ))}
        {points.map((p, i) => (
          <rect key={i} x={p.x - 6} y={pad.t} width="12" height={H - pad.t - pad.b} fill="transparent"
            onMouseEnter={() => setHover(p)} />
        ))}
        {hover && (
          <g>
            <line x1={hover.x} x2={hover.x} y1={pad.t} y2={H - pad.b} stroke="#12151C" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <circle cx={hover.x} cy={hover.y} r="4.5" fill="#fff" stroke="#1B39C9" strokeWidth="2.5" />
          </g>
        )}
      </svg>
      {hover && (
        <div className="pointer-events-none absolute top-2 rounded-lg border border-line bg-white px-3 py-2 shadow-lift"
          style={{ left: `${(hover.x / W) * 100}%`, transform: 'translateX(-50%)' }}>
          <p className="text-[12px] text-ink-muted">{formatDate(hover.d[xKey])}</p>
          <p className="tnum text-[14px] font-semibold">{valueFormat(hover.d[yKey])}</p>
          {hover.d.orders != null && <p className="tnum text-[12px] text-ink-muted">{hover.d.orders} orders</p>}
        </div>
      )}
    </div>
  );
}

export function BarChart({ data = [], labelKey = 'category', valueKey = 'revenue', height = 240, valueFormat = formatCompactCurrency }) {
  if (!data.length) return <ChartEmpty height={height} />;
  const max = Math.max(...data.map((d) => d[valueKey]), 1);

  return (
    <div className="space-y-3" style={{ minHeight: height }}>
      {data.map((d, i) => (
        <div key={d[labelKey]} className="grid grid-cols-[minmax(90px,1fr)_3fr_auto] items-center gap-3">
          <span className="truncate text-[13px] text-ink-soft">{d[labelKey]}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-sunken">
            <div className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${(d[valueKey] / max) * 100}%`, background: palette[i % palette.length] }} />
          </div>
          <span className="tnum text-[13px] font-semibold">{valueFormat(d[valueKey])}</span>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ data = [], valueKey = 'count', labelKey = 'status', size = 180 }) {
  const total = data.reduce((s, d) => s + d[valueKey], 0);
  if (!total) return <ChartEmpty height={size} />;
  const R = 70, C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={size} height={size} viewBox="0 0 180 180" role="img" aria-label="Order status split">
        <g transform="translate(90,90) rotate(-90)">
          {data.map((d, i) => {
            const len = (d[valueKey] / total) * C;
            const circle = (
              <circle key={d[labelKey]} r={R} fill="none" strokeWidth="18"
                stroke={palette[i % palette.length]} strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset} />
            );
            offset += len;
            return circle;
          })}
        </g>
        <text x="90" y="86" textAnchor="middle" fontSize="24" fontWeight="600" fill="#12151C">{formatNumber(total)}</text>
        <text x="90" y="105" textAnchor="middle" fontSize="12" fill="#6B7280">orders</text>
      </svg>
      <ul className="space-y-2">
        {data.map((d, i) => (
          <li key={d[labelKey]} className="flex items-center gap-2.5 text-[13px]">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: palette[i % palette.length] }} />
            <span className="capitalize text-ink-soft">{d[labelKey]}</span>
            <span className="tnum ml-auto font-semibold">{d[valueKey]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartEmpty({ height }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-line text-[13px] text-ink-muted"
      style={{ height }}>
      No data for this period yet
    </div>
  );
}
