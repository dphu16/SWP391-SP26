import React from "react";
import { useNavigate } from "react-router-dom";
import KpiCard from "./KpiCard";
import Icons from "./Icons";
import { type DashboardStats } from "./helpers";

const I = Icons;

interface KpiGridProps {
  loading: boolean;
  stats: DashboardStats;
}

const KpiGrid: React.FC<KpiGridProps> = ({ loading, stats }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-[88px] rounded-2xl" />
        ))
      ) : (
        <>
          <KpiCard
            id="kpi-total"
            label="Total Employees"
            value={stats.total}
            sub="In the system"
            icon={<span className="text-primary">{I.users}</span>}
            accent="bg-primary/10"
            onClick={() => navigate("/employees")}
          />
          <KpiCard
            id="kpi-active"
            label="Active"
            value={stats.active}
            sub={
              stats.total > 0
                ? `${Math.round((stats.active / stats.total) * 100)}% of workforce`
                : "—"
            }
            icon={<span className="text-emerald-600">{I.check}</span>}
            accent="bg-emerald-50"
          />
          <KpiCard
            id="kpi-onboarding"
            label="Onboarding"
            value={stats.onboarding}
            sub="New hires in progress"
            icon={<span className="text-amber-500">{I.arrow}</span>}
            accent="bg-amber-50"
            onClick={() => navigate("/onboarding")}
          />
          <KpiCard
            id="kpi-offboarding"
            label="On Leave"
            value={stats.onLeave}
            sub="Currently on leave"
            icon={<span className="text-rose-500">{I.clock}</span>}
            accent="bg-rose-50"
          />
        </>
      )}
    </div>
  );
};

export default KpiGrid;
