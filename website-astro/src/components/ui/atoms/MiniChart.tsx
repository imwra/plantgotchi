export interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
}

const PRIMARY = '#4a9e3f';
const WHITE_FILL = '#fffdf5';

export default function MiniChart({ data, width = 80, height = 28 }: MiniChartProps) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : 0;

  const points = data.map((v, i) => ({
    x: data.length === 1 ? width / 2 : i * step,
    y: height - ((v - min) / range) * (height - 6) - 3,
  }));

  const areaPath = `M${points[0].x},${height} ${points.map((p) => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${height} Z`;
  const gradientId = `cf-${width}-${height}`;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.2} />
          <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <polyline
        fill="none"
        stroke={PRIMARY}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points.map((p) => `${p.x},${p.y}`).join(' ')}
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={2.5}
          fill={WHITE_FILL}
          stroke={PRIMARY}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}
