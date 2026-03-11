import React from "react";
import FilterBar from "../../components/ui/FilterBar";
import { Avatar, ErrorState, EmptyState } from "./shared";
import SkeletonRow from "./shared/SkeletonRow";
import ProgressBadge from "./onboarding/ProgressBadge";
import StatusModal from "./onboarding/StatusModal";
import { useEmployeeOnboarding } from "./hooks/useEmployeeOnboarding";

const COLUMNS = [
  { key: "candidateName", label: "Employee" },
  { key: "candidateEmail", label: "Email" },
  { key: "candidatePhone", label: "Phone" },
  { key: "jobTitle", label: "Position" },
  { key: "progressStatus", label: "Progress" },
];

const EmployeeOnboarding: React.FC = () => {
  const {
    loading,
    error,
    filteredOnboarding,
    setSearchTerm,
    handleFilterChange,
    statusModalApp,
    setStatusModalApp,
    handleResubmit,
  } = useEmployeeOnboarding();

  if (error && !loading) {
    return (
      <ErrorState message={error} onRetry={() => window.location.reload()} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary-light font-heading">
          Onboarding In Progress
        </h1>
        <p className="text-text-secondary-light text-sm">
          Track the onboarding progress for employees.
        </p>
      </div>

      <FilterBar onSearch={setSearchTerm} onFilterChange={handleFilterChange} />

      <div className="rounded-2xl border border-border-light bg-surface-light overflow-hidden shadow-card animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-surface-light">
              <tr className="border-b border-gray-100">
                {COLUMNS.map((col, idx) => (
                  <th
                    key={col.key}
                    className={`px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light ${idx === 0 ? "pl-6" : ""}`}
                  >
                    {col.key !== "status" && col.key !== "progressStatus" ? (
                      <button className="flex items-center gap-1.5 hover:text-text-primary-light transition-colors cursor-pointer group">
                        {col.label}
                        <svg
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8 2a.75.75 0 01.75.75v8.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V2.75A.75.75 0 018 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                : filteredOnboarding.map((app) => (
                    <tr
                      key={app.id}
                      className="table-row-hover group hover:bg-gray-50/80"
                    >
                      <td className="px-4 py-3.5 pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar name={app.candidateName || "?"} />
                          <div className="font-semibold text-text-primary-light leading-snug">
                            {app.candidateName}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-text-primary-light">
                        {app.candidateEmail || (
                          <span className="text-text-muted-light">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium text-text-secondary-light bg-gray-100 px-2 py-0.5 rounded-md">
                          {app.candidatePhone || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-text-primary-light">
                        {app.jobTitle || (
                          <span className="text-text-muted-light">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <ProgressBadge
                          status={app.progressStatus}
                          onClick={() => setStatusModalApp(app)}
                        />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredOnboarding.length === 0 && (
          <EmptyState
            title="No onboarding employees in progress"
            description="Employees with incomplete onboarding will appear here."
          />
        )}
      </div>

      <StatusModal
        app={statusModalApp}
        onClose={() => setStatusModalApp(null)}
        onResubmit={handleResubmit}
      />
    </div>
  );
};

export default EmployeeOnboarding;
