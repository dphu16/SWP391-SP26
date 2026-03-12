import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import type { Application, PageResponse } from "../types";
import FilterBar from "./FilterBar";

const API_URL = "/api/applications/hired";

// ─── Status Badge (matches EmployeeTable style) ────────────────────────────────
const ONBOARDING_STATUS_CONFIG: Record<
 string,
 { dot: string; text: string; bg: string }
> = {
 COMPLETED: {
 dot: "bg-emerald-500",
 text: "text-emerald-700 ",
 bg: "bg-emerald-50 ",
 },
 INPROGRESS: {
 dot: "bg-amber-500",
 text: "text-amber-700 ",
 bg: "bg-amber-50 ",
 },
 IN_PROGRESS: {
 dot: "bg-amber-500",
 text: "text-amber-700 ",
 bg: "bg-amber-50 ",
 },
  PENDING: {
  dot: "bg-gray-400",
  text: "text-gray-600 ",
  bg: "bg-gray-100 ",
  },
  HIRED: {
  dot: "bg-emerald-500",
  text: "text-emerald-700 ",
  bg: "bg-emerald-50 ",
  },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
 const key = status?.toUpperCase().replace(/\s+/g, "") ?? "";
 const cfg =
 ONBOARDING_STATUS_CONFIG[key] ?? ONBOARDING_STATUS_CONFIG["PENDING"];
 return (
 <span
 className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.text} ${cfg.bg}`}
 >
 <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
 {status}
 </span>
 );
};

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
 <td className="pl-6 pr-4 py-4 w-10">
 <div className="skeleton w-4 h-4 rounded" />
 </td>
 <td className="px-4 py-4">
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
 <td className="px-4 py-4 text-center">
 <div className="skeleton h-7 w-20 rounded-lg mx-auto" />
 </td>
 </tr>
);

interface EmployeeOnboardingProps {
 onAction?: (employeeId: string, actionType: "init" | "continue") => void;
}

const EmployeeOnboarding: React.FC<EmployeeOnboardingProps> = ({
 onAction,
}) => {
 const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState({ category: "department", value: "All Departments" });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleFilterChange = (category: string, value: string) => {
    setFilter({ category, value });
  };

  const filteredApplications = applications.filter(app => {
    const nameStr = app.candidateName || "";
    const emailStr = app.candidateEmail || "";
    const matchesSearch = nameStr.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                         emailStr.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesSearch;
  });

 // Gọi API khi component được mount
 useEffect(() => {
 const fetchApplications = async () => {
 try {
 setLoading(true);
 setError(null);

 const response = await apiClient.get<PageResponse<Application>>(API_URL);
 setApplications(response.data.content);
 } catch (err: unknown) {
 if (err instanceof Error && 'response' in err) {
 const axErr = err as { response?: { status: number; statusText: string } };
 setError(
 axErr.response
 ? `Lỗi ${axErr.response.status}: ${axErr.response.statusText}`
 : "Không thể kết nối đến server. Hãy kiểm tra lại backend.",
 );
 } else {
 setError("Đã xảy ra lỗi không xác định.");
 }
 } finally {
 setLoading(false);
 }
 };

 fetchApplications();
 }, []);

 // Hiển thị lỗi nếu gọi API thất bại
 if (error && !loading) {
 return (
 <div className="rounded-2xl border border-rose-200 bg-surface-light p-16 flex flex-col items-center gap-4 text-center animate-fade-in">
 <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
 <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-rose-500">
 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
 </svg>
 </div>
 <div>
 <p className="font-semibold text-text-primary-light ">{error}</p>
 <p className="text-sm text-text-secondary-light mt-1">
 Kiểm tra kết nối backend và thử lại.
 </p>
 </div>
 <button
 onClick={() => window.location.reload()}
 className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer btn-primary-action"
 >
 Thử lại
 </button>
 </div>
 );
 }

 const handleAction = (app: Application, actionType: "init" | "continue") => {
 const params = new URLSearchParams({
 name: app.candidateName || "",
 email: app.candidateEmail || "",
 phone: app.candidatePhone || "",
 job: app.jobTitle || "",
 action: actionType,
 });
 navigate(`/onboarding/${app.id}/profile?${params.toString()}`);

 if (onAction) {
 onAction(app.id, actionType);
 }
 };

 const COLUMNS = [
 { key: "candidateName", label: "Candidate" },
 { key: "candidateEmail", label: "Email" },
 { key: "candidatePhone", label: "Phone" },
 { key: "jobTitle", label: "Job Title" },
 { key: "status", label: "Status" },
 ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary-light font-heading">
          Employee Onboarding
        </h1>
        <p className="text-text-secondary-light text-sm">
          Track and manage the onboarding process for newly hired candidates.
        </p>
      </div>

      <FilterBar 
        onSearch={setSearchTerm} 
        onFilterChange={handleFilterChange}
      />

      <div className="rounded-2xl border border-border-light bg-surface-light overflow-hidden shadow-card animate-fade-in">
 {/* Table */}
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 {/* Sticky Header */}
 <thead className="sticky top-0 z-10 bg-surface-light ">
 <tr className="border-b border-gray-100 ">
 {/* Checkbox */}
 <th className="pl-6 pr-4 py-4 w-10">
 <input
 type="checkbox"
 className="w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-0 focus:ring-offset-0 bg-transparent cursor-pointer accent-primary"
 aria-label="Select all"
 />
 </th>

 {COLUMNS.map((col) => (
 <th
 key={col.key}
 className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light "
 >
 {col.key !== "status" ? (
 <button className="flex items-center gap-1.5 hover:text-text-primary-light transition-colors cursor-pointer group">
 {col.label}
 <svg
 viewBox="0 0 16 16"
 fill="currentColor"
 className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors"
 >
 <path fillRule="evenodd" d="M8 2a.75.75 0 01.75.75v8.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V2.75A.75.75 0 018 2z" clipRule="evenodd" />
 </svg>
 </button>
 ) : (
 col.label
 )}
 </th>
 ))}

 {/* Actions */}
 <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light text-center sticky right-0 bg-surface-light ">
 Action
 </th>
 </tr>
 </thead>

 <tbody className="divide-y divide-gray-50 text-sm">
 {loading
 ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
  : filteredApplications.map((app) => (
  <tr
 key={app.id}
 className="table-row-hover group hover:bg-gray-50/80 "
 >
 {/* Checkbox */}
 <td className="pl-6 pr-4 py-3.5">
 <input
 type="checkbox"
 className="w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-0 focus:ring-offset-0 bg-transparent cursor-pointer accent-primary"
 aria-label={`Select ${app.candidateName}`}
 />
 </td>

 {/* Candidate Name */}
 <td className="px-4 py-3.5">
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

 {/* Job Title */}
 <td className="px-4 py-3.5 text-text-primary-light ">
 {app.jobTitle || (
 <span className="text-text-muted-light ">—</span>
 )}
 </td>

 {/* Status */}
 <td className="px-4 py-3.5">
 <StatusBadge status={app.status} />
 </td>

 {/* Action */}
  <td className="px-4 py-3.5 text-center sticky right-0 bg-surface-light">
    <div className="flex items-center justify-center">
      {(!app.onboardingStatus || app.onboardingStatus === "PENDING" || app.onboardingStatus === "IN_PROGRESS") ? (
        <button
          onClick={() => handleAction(app, app.onboardingStatus === "IN_PROGRESS" ? "continue" : "init")}
          title={app.onboardingStatus === "IN_PROGRESS" ? "Continue Onboarding" : "Initialize Onboarding"}
          className="p-2 rounded-full text-primary hover:text-white hover:bg-primary transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-0.5">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      ) : app.onboardingStatus === "COMPLETED" ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-700 bg-emerald-50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Done
        </span>
      ) : null}
    </div>
  </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Empty state */}
 {!loading && filteredApplications.length === 0 && (
 <div className="py-20 flex flex-col items-center gap-3 text-center animate-fade-in">
 <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
 <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-gray-400">
 <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
 </svg>
 </div>
 <p className="font-semibold text-text-primary-light ">
 No onboarding candidates found
 </p>
 <p className="text-sm text-text-secondary-light ">
 Hired candidates will appear here for onboarding.
 </p>
 </div>
 )}

 {/* Pagination */}
 <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-1">
 <button
 className="p-1.5 rounded-lg hover:bg-gray-100 text-text-secondary-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
 aria-label="Previous page"
 >
 <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
 <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 010 1.06L7.06 8l2.72 2.72a.75.75 0 11-1.06 1.06L5.47 8.53a.75.75 0 010-1.06l3.25-3.25a.75.75 0 011.06 0z" clipRule="evenodd" />
 </svg>
 </button>
 <button className="w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer bg-primary text-white shadow-sm">
 1
 </button>
 <button className="p-1.5 rounded-lg hover:bg-gray-100 text-text-secondary-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
 <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
 <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd" />
 </svg>
 </button>
      </div>
    </div>
  </div>
  );
};

export default EmployeeOnboarding;
