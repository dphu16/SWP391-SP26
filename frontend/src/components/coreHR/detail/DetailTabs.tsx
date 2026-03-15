import React from "react";
import type { TabType } from "../hooks/useEmployeeDetail";

interface DetailTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const DetailTabs: React.FC<DetailTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="rounded-2xl border border-border-light bg-surface-light shadow-card px-6 animate-fade-in">
      <nav
        aria-label="Employee detail tabs"
        className="flex overflow-x-auto no-scrollbar"
      >
        {(["General", "Job"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-center whitespace-nowrap py-4 px-4 border-b-2 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary-light hover:text-text-primary-light hover:border-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default DetailTabs;
