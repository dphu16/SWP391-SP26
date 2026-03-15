import React from "react";
import type { OffboardingResponse } from "../../../services/offboardingService";

interface FilterTabsProps {
  requests: OffboardingResponse[];
  filterStatus: string;
  setFilterStatus: (status: string) => void;
}

const TABS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "MANAGER_APPROVED", label: "Approved" },
  { value: "HR_CONFIRMED", label: "HR Confirmed" },
];

const FilterTabs: React.FC<FilterTabsProps> = ({
  requests,
  filterStatus,
  setFilterStatus,
}) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setFilterStatus(tab.value)}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            filterStatus === tab.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
          {tab.value !== "ALL" && (
            <span className="ml-1.5 text-xs opacity-60">
              {
                requests.filter((r) =>
                  tab.value === "ALL" ? true : r.status === tab.value,
                ).length
              }
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;
