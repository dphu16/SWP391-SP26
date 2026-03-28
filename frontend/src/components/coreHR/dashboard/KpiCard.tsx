import React from "react";

interface KpiCardProps {
  id: string;
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  trend?: { value: string; positive: boolean };
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({
  id,
  label,
  value,
  sub,
  icon,
  accent,
  trend,
  onClick,
}) => (
  <div
    id={id}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    className={`bento-card rounded-2xl border border-border-light bg-surface-light shadow-card p-5 flex gap-4 items-start ${onClick ? "cursor-pointer" : ""}`}
  >
    <div
      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
        {label}
      </p>
      <p className="text-2xl font-bold font-heading text-text-primary-light mt-0.5 leading-none">
        {value}
      </p>
      {sub && <p className="text-xs text-text-secondary-light mt-1">{sub}</p>}
      {trend && (
        <p
          className={`text-xs font-medium mt-1 ${trend.positive ? "text-emerald-600" : "text-rose-600"}`}
        >
          {trend.positive ? "↑" : "↓"} {trend.value}
        </p>
      )}
    </div>
  </div>
);

export default KpiCard;
