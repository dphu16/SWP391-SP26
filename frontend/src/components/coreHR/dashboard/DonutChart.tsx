import React from "react";

export interface DonutSlice {
  value: number;
  color: string;
  label: string;
}

const DonutChart: React.FC<{ slices: DonutSlice[]; total: number }> = ({
  slices,
  total,
}) => {
  const R = 52;
  const cx = 64;
  const cy = 64;
  const circumference = 2 * Math.PI * R;

  let offset = 0;
  const paths = slices.map((s) => {
    const pct = total > 0 ? s.value / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const el = (
      <circle
        key={s.label}
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke={s.color}
        strokeWidth="20"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    );
    offset += dash;
    return el;
  });

  return (
    <svg viewBox="0 0 128 128" className="w-36 h-36 -rotate-90">
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="currentColor"
        strokeWidth="20"
        className="text-gray-100"
      />
      {total > 0 ? paths : null}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-2xl font-bold fill-current"
        style={{
          transform: "rotate(90deg)",
          transformOrigin: "center",
          fontSize: "22px",
          fontWeight: 700,
        }}
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          transform: "rotate(90deg)",
          transformOrigin: "center",
          fontSize: "9px",
          fill: "#94a3b8",
        }}
      >
        Total
      </text>
    </svg>
  );
};

export default DonutChart;
