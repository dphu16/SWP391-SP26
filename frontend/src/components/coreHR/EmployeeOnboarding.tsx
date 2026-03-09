import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import type { Application, OnboardingListResponse } from "./types";
import FilterBar from "../../components/ui/FilterBar";

const API_URL = "/api/applications/hired";

// ─── Avatar (matches EmployeeTable style) ──────────────────────────────────────
const Avatar: React.FC<{ name: string }> = ({ name }) => {
  const initials =
    name
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "??";

  const colors = [
    "bg-primary/15 text-primary",
    "bg-blue-100 text-blue-600 ",
    "bg-purple-100 text-purple-600 ",
    "bg-amber-100 text-amber-700 ",
    "bg-rose-100 text-rose-600 ",
  ];
  const colorIdx = (name?.charCodeAt(0) ?? 0) % colors.length;

  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${colors[colorIdx]}`}
    >
      {initials}
    </div>
  );
};

// ─── Skeleton Row ──────────────────────────────────────────────────────────────
const SkeletonRow: React.FC = () => (
  <tr className="border-b border-gray-100 ">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-9 h-9 rounded-full" />
        <div className="space-y-1.5">
          <div className="skeleton h-3.5 w-32 rounded" />
          <div className="skeleton h-2.5 w-20 rounded" />
        </div>
      </div>
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-3.5 w-36 rounded" />
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-3.5 w-28 rounded" />
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-3.5 w-32 rounded" />
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-6 w-20 rounded-full" />
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-3.5 w-24 rounded" />
    </td>
  </tr>
);

interface EmployeeOnboardingProps {
  onAction?: (employeeId: string, actionType: "init" | "continue") => void;
}

const PROGRESS_STATUS_CONFIG: Record<
  string,
  { dot: string; text: string; bg: string; label: string }
> = {
  PENDING_REVIEW: {
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-100",
    label: "Review",
  },
  PENDING_VERIFY: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    label: "Verify",
  },
  PENDING_ACTIVATION: {
    dot: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
    label: "Activation",
  },
  PASSWORD_CREATED: {
    dot: "bg-indigo-500",
    text: "text-indigo-700",
    bg: "bg-indigo-50",
    label: "Password Set",
  },
  COMPLETED: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    label: "Done",
  },
  REJECTED: {
    dot: "bg-rose-500",
    text: "text-rose-700",
    bg: "bg-rose-50",
    label: "Rejected",
  },
};

const ProgressBadge: React.FC<{
  status: string | null;
  onClick?: () => void;
}> = ({ status, onClick }) => {
  const config = status ? PROGRESS_STATUS_CONFIG[status] : null;
  if (!config) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-gray-600 bg-gray-100 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        New
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all ${config.text} ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </button>
  );
};

// ─── Status Detail Modal ───────────────────────────────────────────────────────
const StatusModal: React.FC<{
  app: Application | null;
  onClose: () => void;
  onResubmit?: (app: Application) => void;
}> = ({ app, onClose, onResubmit }) => {
  if (!app) return null;

  const steps = [
    { key: "PENDING_REVIEW", label: "Manager Review" },
    { key: "PENDING_VERIFY", label: "Verification" },
    { key: "PENDING_ACTIVATION", label: "Activation" },
    { key: "PASSWORD_CREATED", label: "Password Set" },
    { key: "COMPLETED", label: "Completed" },
  ];

  const currentIndex = steps.findIndex((s) => s.key === app.progressStatus);
  const isRejected = app.progressStatus === "REJECTED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-text-primary-light">
            Onboarding Status
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 text-gray-400"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={app.candidateName || "?"} />
            <div>
              <p className="font-semibold text-text-primary-light">
                {app.candidateName}
              </p>
              <p className="text-xs text-text-secondary-light">
                {app.jobTitle || "—"}
              </p>
            </div>
          </div>
        </div>

        {isRejected ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-sm font-semibold text-rose-700">
                Rejected by Manager
              </span>
            </div>
            {app.rejectionReason && (
              <p className="text-sm text-rose-600 ml-4 mb-3">
                {app.rejectionReason}
              </p>
            )}
            <button
              onClick={() => {
                if (onResubmit) onResubmit(app);
                onClose();
              }}
              className="w-full py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
            >
              Edit & Resubmit
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {steps.map((step, idx) => {
              const isDone = currentIndex >= idx;
              const isCurrent = currentIndex === idx;
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDone
                          ? "bg-primary text-white"
                          : isCurrent
                            ? "bg-primary/20 text-primary border-2 border-primary"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isDone ? (
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-3.5 h-3.5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="text-[10px] font-bold">{idx + 1}</span>
                      )}
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`w-0.5 h-6 ${isDone ? "bg-primary" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                  <div className="pt-1">
                    <p
                      className={`text-sm font-medium ${isDone ? "text-text-primary-light" : "text-gray-400"}`}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-gray-100 text-sm font-semibold text-text-primary-light hover:bg-gray-200 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const EmployeeOnboarding: React.FC<EmployeeOnboardingProps> = () => {
  const navigate = useNavigate();
  const [onboardingEmployees, setOnboardingEmployees] = useState<Application[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusModalApp, setStatusModalApp] = useState<Application | null>(
    null,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState({
    category: "department",
    value: "All Departments",
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleFilterChange = (category: string, value: string) => {
    setFilter({ category, value });
  };

  const filterList = (list: Application[]) =>
    list.filter((app) => {
      const nameStr = app.candidateName || "";
      const emailStr = app.candidateEmail || "";
      const matchesSearch =
        nameStr.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        emailStr.toLowerCase().includes(debouncedSearch.toLowerCase());

      let matchesFilter = true;
      if (filter.value && !filter.value.startsWith("All")) {
        switch (filter.category) {
          case "position":
            matchesFilter = app.jobTitle === filter.value;
            break;
          case "status":
            matchesFilter =
              app.status === filter.value ||
              app.onboardingStatus === filter.value ||
              app.progressStatus === filter.value;
            break;
        }
      }

      return matchesSearch && matchesFilter;
    });

  const filteredOnboarding = filterList(onboardingEmployees);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<OnboardingListResponse>(API_URL);
      setOnboardingEmployees(response.data.onboardingEmployees ?? []);
    } catch (err: unknown) {
      if (err instanceof Error && "response" in err) {
        const axErr = err as {
          response?: { status: number; statusText: string };
        };
        setError(
          axErr.response
            ? `Error ${axErr.response.status}: ${axErr.response.statusText}`
            : "Cannot connect to server. Please check the backend.",
        );
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Hiển thị lỗi nếu gọi API thất bại
  if (error && !loading) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-surface-light p-16 flex flex-col items-center gap-4 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-6 h-6 text-rose-500"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-text-primary-light ">{error}</p>
          <p className="text-sm text-text-secondary-light mt-1">
            Please check the backend connection and try again.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer btn-primary-action"
        >
          Retry
        </button>
      </div>
    );
  }

  const handleResubmit = (app: Application) => {
    navigate(`/onboarding/${app.id}/profile?action=resubmit`);
  };

  const columns = [
    { key: "candidateName", label: "Employee" },
    { key: "candidateEmail", label: "Email" },
    { key: "candidatePhone", label: "Phone" },
    { key: "jobTitle", label: "Position" },
    { key: "progressStatus", label: "Progress" },
  ];

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
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Sticky Header */}
            <thead className="sticky top-0 z-10 bg-surface-light ">
              <tr className="border-b border-gray-100 ">
                {columns.map((col, idx) => (
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
                      className="table-row-hover group hover:bg-gray-50/80 "
                    >
                      {/* Candidate Name */}
                      <td className="px-4 py-3.5 pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar name={app.candidateName || "?"} />
                          <div>
                            <div className="font-semibold text-text-primary-light leading-snug">
                              {app.candidateName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 text-text-primary-light ">
                        {app.candidateEmail || (
                          <span className="text-text-muted-light ">—</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium text-text-secondary-light bg-gray-100 px-2 py-0.5 rounded-md">
                          {app.candidatePhone || "—"}
                        </span>
                      </td>

                      {/* Job Title / Position */}
                      <td className="px-4 py-3.5 text-text-primary-light ">
                        {app.jobTitle || (
                          <span className="text-text-muted-light ">—</span>
                        )}
                      </td>

                      {/* Status / Progress */}
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

        {/* Empty state */}
        {!loading && filteredOnboarding.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-3 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-6 h-6 text-gray-400"
              >
                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
              </svg>
            </div>
            <p className="font-semibold text-text-primary-light ">
              No onboarding employees in progress
            </p>
            <p className="text-sm text-text-secondary-light ">
              Employees with incomplete onboarding will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Status Detail Modal */}
      <StatusModal
        app={statusModalApp}
        onClose={() => setStatusModalApp(null)}
        onResubmit={handleResubmit}
      />
    </div>
  );
};

export default EmployeeOnboarding;
