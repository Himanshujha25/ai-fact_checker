
import React from 'react';

const VerdictPieChart = ({ claims }) => {
  const counts = { true: 0, false: 0, partial: 0, unverifiable: 0 };
  claims.forEach(c => {
    const v = (c.verdict || '').toLowerCase();
    if (v === 'true') counts.true++;
    else if (v === 'false') counts.false++;
    else if (v === 'partially true') counts.partial++;
    else counts.unverifiable++;
  });
  const total = claims.length || 1;
  const data = [
    { label: 'True', count: counts.true, color: '#10b981' },
    { label: 'False', count: counts.false, color: '#ef4444' },
    { label: 'Partial', count: counts.partial, color: '#f59e0b' },
    { label: 'Unknown', count: counts.unverifiable, color: '#475569' },
  ].filter(d => d.count > 0);

  let cumulative = 0;
  const slices = data.map(d => {
    const start = cumulative;
    const angle = (d.count / total) * 360;
    cumulative += angle;
    return { ...d, start, angle };
  });

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = (Math.PI / 180) * (angleDeg - 90);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        {slices.map((s, i) => {
          if (s.angle >= 360) return <circle key={i} cx={60} cy={60} r={50} fill={s.color} />;
          const s1 = polarToCartesian(60, 60, 50, s.start);
          const s2 = polarToCartesian(60, 60, 50, s.start + s.angle);
          const large = s.angle > 180 ? 1 : 0;
          return <path key={i} d={`M60,60 L${s1.x},${s1.y} A50,50 0 ${large},1 ${s2.x},${s2.y} Z`} fill={s.color} />;
        })}
        <circle cx={60} cy={60} r={30} fill="var(--bg-dark, #0c0d10)" />
        <text x="60" y="65" textAnchor="middle" fill="white" fontSize="16" fontWeight="800">{total}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
            <span>{d.label}: {d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerdictPieChart;
