/** A plain inline-SVG area chart — no charting library for one line. */
export function TrendChart({ points }: { points: { day: string; cents: number }[] }) {
  const width = 720;
  const height = 200;
  const padding = 24;
  const max = Math.max(1, ...points.map((p) => p.cents));

  const coords = points.map((p, i) => {
    const x = padding + (i / Math.max(1, points.length - 1)) * (width - padding * 2);
    const y = height - padding - (p.cents / max) * (height - padding * 2);
    return [x, y] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const area = `${line} L${coords[coords.length - 1]?.[0] ?? padding},${height - padding} L${padding},${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Daily contributions, last two weeks">
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--champagne)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--champagne)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trend-fill)" />
      <path d={line} fill="none" stroke="var(--champagne)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {coords.map(([x, y], i) => (
        <circle key={points[i].day} cx={x} cy={y} r="2.5" fill="var(--champagne)" />
      ))}
    </svg>
  );
}
