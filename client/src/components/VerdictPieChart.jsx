import React, { useState } from 'react';

const COLORS = {
  true:          { stroke: '#10b981', label: 'Verified',      bg: 'rgba(16,185,129,0.12)'  },
  false:         { stroke: '#ef4444', label: 'False',         bg: 'rgba(239,68,68,0.12)'   },
  partial:       { stroke: '#f59e0b', label: 'Partial',       bg: 'rgba(245,158,11,0.12)'  },
  unverifiable:  { stroke: '#475569', label: 'Unknown',       bg: 'rgba(71,85,105,0.12)'   },
};

const polarToCartesian = (cx, cy, r, deg) => {
  const rad = (Math.PI / 180) * (deg - 90);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const describeArc = (cx, cy, r, startDeg, endDeg) => {
  const s = polarToCartesian(cx, cy, r, startDeg);
  const e = polarToCartesian(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
};

export default function VerdictPieChart({ claims }) {
  const [activeKey, setActiveKey] = useState(null);

  const counts = { true: 0, false: 0, partial: 0, unverifiable: 0 };
  (claims || []).forEach(c => {
    const v = (c.verdict || '').toLowerCase();
    if      (['true','accurate','verified'].includes(v))   counts.true++;
    else if (['false','inaccurate'].includes(v))           counts.false++;
    else if (['partially true','mixed'].includes(v))       counts.partial++;
    else                                                   counts.unverifiable++;
  });

  const total = Object.values(counts).reduce((a,b) => a+b, 0);

  if (total === 0) return (
    <div className="flex items-center justify-center px-6 py-5 rounded-xl border border-dashed border-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/20">
      Awaiting data…
    </div>
  );

  /* Build arc slices */
  const GAP = 3; // degrees gap between slices
  let cursor = 0;
  const slices = Object.entries(counts)
    .filter(([,n]) => n > 0)
    .map(([key, count]) => {
      const sweep = (count / total) * 360 - GAP;
      const slice = { key, count, pct: Math.round((count/total)*100), start: cursor, sweep, color: COLORS[key] };
      cursor += sweep + GAP;
      return slice;
    });

  const CX = 60, CY = 60, R_OUTER = 50, R_INNER = 34, STROKE = R_OUTER - R_INNER;

  return (
    <div className="flex items-center gap-8">
      {/* ── Donut ── */}
      <div className="relative flex-shrink-0">
        <svg
          width={120} height={120} viewBox="0 0 120 120"
          className="transition-transform duration-300"
          style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.4))' }}
        >
          {/* Background ring */}
          <circle
            cx={CX} cy={CY} r={(R_OUTER + R_INNER) / 2}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={STROKE}
          />

          {/* Arcs */}
          {slices.map(s => {
            const endDeg   = s.start + s.sweep;
            const midAngle = s.start + s.sweep / 2;
            const isActive = activeKey === s.key;
            const rOff     = isActive ? 3 : 0;
            const offset   = polarToCartesian(CX, CY, rOff, midAngle);
            const tx       = offset.x - CX;
            const ty       = offset.y - CY;

            return (
              <g key={s.key}
                style={{ transform: `translate(${tx}px,${ty}px)`, transition:'transform 0.25s ease', cursor:'pointer' }}
                onMouseEnter={() => setActiveKey(s.key)}
                onMouseLeave={() => setActiveKey(null)}
              >
                <path
                  d={describeArc(CX, CY, (R_OUTER+R_INNER)/2, s.start, endDeg)}
                  fill="none"
                  stroke={s.color.stroke}
                  strokeWidth={isActive ? STROKE + 3 : STROKE}
                  strokeLinecap="round"
                  opacity={activeKey && !isActive ? 0.25 : 0.85}
                  style={{ transition: 'stroke-width 0.2s, opacity 0.2s' }}
                />
              </g>
            );
          })}

          {/* Centre label */}
          {activeKey ? (
            <>
              <text x={CX} y={CY - 6} textAnchor="middle"
                fill={COLORS[activeKey].stroke}
                fontSize="14" fontWeight="900" fontFamily="inherit">
                {slices.find(s=>s.key===activeKey)?.pct}%
              </text>
              <text x={CX} y={CY + 8} textAnchor="middle"
                fill="rgba(255,255,255,0.3)"
                fontSize="7" fontWeight="700" fontFamily="inherit"
                style={{ textTransform:'uppercase', letterSpacing:'0.08em' }}>
                {COLORS[activeKey].label}
              </text>
            </>
          ) : (
            <>
              <text x={CX} y={CY - 5} textAnchor="middle"
                fill="rgba(255,255,255,0.85)"
                fontSize="16" fontWeight="900" fontFamily="inherit">
                {total}
              </text>
              <text x={CX} y={CY + 9} textAnchor="middle"
                fill="rgba(255,255,255,0.2)"
                fontSize="7" fontWeight="700" fontFamily="inherit"
                style={{ textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Claims
              </text>
            </>
          )}
        </svg>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-col gap-2.5">
        {slices.map(s => {
          const isActive = activeKey === s.key;
          return (
            <div key={s.key}
              className="flex items-center gap-3 cursor-default"
              onMouseEnter={() => setActiveKey(s.key)}
              onMouseLeave={() => setActiveKey(null)}
            >
              {/* Swatch */}
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200"
                style={{
                  background: s.color.stroke,
                  boxShadow: isActive ? `0 0 8px ${s.color.stroke}` : 'none',
                  transform: isActive ? 'scale(1.4)' : 'scale(1)',
                }}
              />
              {/* Text */}
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest transition-colors duration-200"
                  style={{ color: isActive ? s.color.stroke : 'rgba(255,255,255,0.45)' }}>
                  {s.color.label}
                </span>
                <span className="text-[10px] font-semibold"
                  style={{ color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }}>
                  {s.pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}