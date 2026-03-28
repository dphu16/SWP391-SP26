import React from "react";
import FilterBar from "../../components/ui/FilterBar";
import type { FilterCategory } from "../../components/ui/FilterBar";
import { Avatar, ErrorState, EmptyState } from "./shared";
import SkeletonRow from "./shared/SkeletonRow";
import { PROGRESS_STATUS_CONFIG } from "./shared/statusConfigs";
import { useEmployeeOnboarding } from "./hooks/useEmployeeOnboarding";

const ONBOARDING_FILTERS: FilterCategory[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "All Statuses", value: "All Statuses" },
      { label: "Review", value: "PENDING_REVIEW" },
      { label: "Verify", value: "PENDING_VERIFY" },
      { label: "Rejected", value: "REJECTED" },
      { label: "Activation", value: "PENDING_ACTIVATION" },
      { label: "Done", value: "COMPLETED" },
    ],
  },
];

const COLUMNS = [
  { key: "candidateName", label: "Employee" },
  { key: "candidateEmail", label: "Email" },
  { key: "candidatePhone", label: "Phone" },
  { key: "jobTitle", label: "Position" },
  { key: "progressStatus", label: "Status" },
  { key: "actions", label: "Actions" },
];

const EmployeeOnboarding: React.FC = () => {
  const {
    loading,
    error,
    filteredOnboarding,
    setSearchTerm,
    handleFilterChange,
    handleResubmit,
    handleCancel,
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

      <FilterBar 
        onSearch={setSearchTerm} 
        onFilterChange={handleFilterChange} 
        searchPlaceholder="Search candidates by name or email..."
        filters={ONBOARDING_FILTERS}
      />

      <div className="rounded-2xl border border-border-light bg-surface-light overflow-hidden shadow-card animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-surface-light">
              <tr className="border-b border-gray-100">
                {COLUMNS.map((col, idx) => (
                  <th
                    key={col.key}
                    className={`px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light ${idx === 0 ? "pl-6" : ""} ${col.key === "actions" ? "text-right pr-6" : ""}`}
                  >
                    {col.label}
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
                        {(() => {
                           const status = app.progressStatus;
                           const config = status ? PROGRESS_STATUS_CONFIG[status] : null;

                           if (!config) return <span className="text-gray-400">—</span>;

                           return (
                             <div className="flex flex-col gap-1">
                               <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${config.text}`}>
                                 <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                                 {config.label}
                               </span>
                               {status === "REJECTED" && app.rejectionReason && (
                                 <span className="text-[10px] text-rose-500 max-w-[150px] line-clamp-1 italic px-1 cursor-help" title={app.rejectionReason}>
                                   "{app.rejectionReason}"
                                 </span>
                                )}
                             </div>
                           );
                        })()}
                      </td>
                      <td className="px-4 py-3.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(app.progressStatus === "PENDING_REVIEW" || app.progressStatus === "REJECTED") && (
                            <button 
                              onClick={() => handleResubmit(app)}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all group/btn"
                              title="Edit Profile Info"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          )}
                          {(app.progressStatus === "PENDING_REVIEW" || app.progressStatus === "PENDING_VERIFY" || app.progressStatus === "REJECTED") && (
                            <button 
                              onClick={() => handleCancel(app)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Cancel Onboarding"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
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


    </div>
  );
};

export default EmployeeOnboarding;
