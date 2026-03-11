import React from "react";
import DonutChart, { type DonutSlice } from "./DonutChart";
import { type DashboardStats } from "./helpers";

interface WorkforceBreakdownProps {
  loading: boolean;
  stats: DashboardStats;
  donutSlices: DonutSlice[];
}

const WorkforceBreakdown: React.FC<WorkforceBreakdownProps> = ({
  loading,
  stats,
  donutSlices,
}) => {
  return (
    <div className="rounded-2xl border border-border-light bg-surface-light shadow-card p-6 animate-fade-in">
      <h3 className="text-sm font-bold text-text-primary-light mb-5">
        Workforce Breakdown
      </h3>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="skeleton w-36 h-36 rounded-full" />
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <DonutChart slices={donutSlices} total={stats.total} />
          <div className="space-y-2.5 flex-1">
            {[
              {
                label: "Active",
                value: stats.active,
                color: "bg-emerald-500",
              },
              {
                label: "Onboarding",
                value: stats.onboarding,
                color: "bg-amber-500",
              },
              {
                label: "Probation",
                value: stats.probation,
                color: "bg-blue-500",
              },
              {
                label: "On Leave",
                value: stats.onLeave,
                color: "bg-rose-500",
              },
              {
                label: "Inactive",
                value: stats.inactive,
                color: "bg-gray-400",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`}
                  />
                  <span className="text-xs text-text-secondary-light">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-primary-light">
                    {item.value}
                  </span>
                  <span className="text-[10px] text-text-muted-light w-8 text-right">
                    {stats.total > 0
                      ? `${Math.round((item.value / stats.total) * 100)}%`
                      : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkforceBreakdown;
