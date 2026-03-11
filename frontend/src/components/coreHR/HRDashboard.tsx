import React from "react";
import WelcomeHero from "./dashboard/WelcomeHero";
import KpiGrid from "./dashboard/KpiGrid";
import WorkforceBreakdown from "./dashboard/WorkforceBreakdown";
import QuickActionGrid from "./dashboard/QuickActionGrid";
import { useHRDashboard } from "./hooks/useHRDashboard";

const HRDashboard: React.FC = () => {
  const { loading, stats, donutSlices, today } = useHRDashboard();

  return (
    <div className="space-y-6 animate-fade-in">
      <WelcomeHero today={today} />

      <KpiGrid loading={loading} stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WorkforceBreakdown
          loading={loading}
          stats={stats}
          donutSlices={donutSlices}
        />
        <QuickActionGrid />
      </div>
    </div>
  );
};

export default HRDashboard;

