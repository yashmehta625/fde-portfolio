"use client";

interface Series {
  label: string;
  color: string;
  values: number[];
}

export function LineChart({
  series,
  height = 160,
  yLabel,
}: {
  series: Series[];
  height?: number;
  yLabel?: string;
}) {
  const width = 600;
  const maxY = Math.max(1, ...series.flatMap((s) => s.values));
  const n = Math.max(1, ...series.map((s) => s.values.length));

  const toPoints = (values: number[]) =>
    values
      .map((v, i) => {
        const x = (i / Math.max(1, n - 1)) * width;
        const y = height - (v / maxY) * (height - 10) - 5;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <line
          x1={0}
          y1={height - 1}
          x2={width}
          y2={height - 1}
          stroke="#404040"
          strokeWidth={1}
        />
        {series.map((s) => (
          <polyline
            key={s.label}
            points={toPoints(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth={1.75}
          />
        ))}
      </svg>
      <div className="flex gap-4 mt-2 flex-wrap">
        {series.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </div>
        ))}
      </div>
      {yLabel && <p className="text-xs text-neutral-600 mt-1">{yLabel}</p>}
    </div>
  );
}
