import React from "react";
import { useNavigate } from "react-router-dom";
import QuickAction from "./QuickAction";
import Icons from "./Icons";

const I = Icons;

const QuickActionGrid: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="lg:col-span-2 rounded-2xl border border-border-light bg-surface-light shadow-card p-6 animate-fade-in">
      <h3 className="text-sm font-bold text-text-primary-light mb-5">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QuickAction
          id="qa-employees"
          label="Employee Directory"
          desc="Browse and manage all staff"
          icon={<span className="text-primary">{I.users}</span>}
          accent="bg-primary/10"
          onClick={() => navigate("/employees")}
        />
        <QuickAction
          id="qa-onboarding"
          label="Onboarding"
          desc="Track new hire progress"
          icon={<span className="text-amber-500">{I.arrow}</span>}
          accent="bg-amber-50"
          onClick={() => navigate("/onboarding")}
        />
        <QuickAction
          id="qa-offboarding"
          label="Offboarding"
          desc="Manage exits and resignations"
          icon={<span className="text-rose-500">{I.bolt}</span>}
          accent="bg-rose-50"
          onClick={() => navigate("/offboarding")}
        />
        <QuickAction
          id="qa-request"
          label="Change Request"
          desc="Submit a personal info change"
          icon={<span className="text-blue-500">{I.document}</span>}
          accent="bg-blue-50"
          onClick={() => navigate("/requests/new")}
        />
      </div>
    </div>
  );
};

export default QuickActionGrid;
