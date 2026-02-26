import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import type { OffboardingEmployee, PageResponse } from "../types";
import { useToast } from "./ui/Toast";

const API_URL = "/api/employees/inactive";

// ─── Handover Status Badge ─────────────────────────────────────────────────────
const HANDOVER_STATUS_CONFIG: Record<
  string,
  { dot: string; text: string; bg: string; border: string }
> = {
  PENDING: {
    dot: "bg-amber-500",
    text: "text-amber-700 ",
    bg: "bg-amber-50 ",
    border: "border border-amber-200 ",
  },
  IN_PROGRESS: {
    dot: "bg-primary",
    text: "text-primary ",
    bg: "bg-primary/5 ",
    border: "border border-primary/20 ",
  },
  COMPLETED: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 ",
    bg: "bg-emerald-50 ",
    border: "border border-emerald-200 ",
  },
};

// ─── Employee Status Badge ─────────────────────────────────────────────────────
const EMP_STATUS_CONFIG: Record<
  string,
  { dot: string; text: string; bg: string }
> = {
  TERMINATED: {
    dot: "bg-rose-500",
    text: "text-rose-700 ",
    bg: "bg-rose-50 ",
  },
  RESIGNED: {
    dot: "bg-gray-400",
    text: "text-gray-600 ",
    bg: "bg-gray-100 ",
  },
};

const HandoverBadge: React.FC<{ status: string }> = ({ status }) => {
  const key = status?.toUpperCase().replace(/\s+/g, "_") ?? "";
  const cfg = HANDOVER_STATUS_CONFIG[key] ?? HANDOVER_STATUS_CONFIG["PENDING"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.text} ${cfg.bg} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

const EmployeeStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const key = status?.toUpperCase() ?? "";
  const cfg = EMP_STATUS_CONFIG[key] ?? EMP_STATUS_CONFIG["RESIGNED"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.text} ${cfg.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar: React.FC<{ name: string; url?: string }> = ({ name, url }) => {
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

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-9 h-9 rounded-full object-cover ring-2 ring-white flex-shrink-0"
      />
    );
  }
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${colors[colorIdx]}`}
    >
      {initials}
    </div>
  );
};

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
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
    <td className="px-4 py-4"><div className="skeleton h-3.5 w-28 rounded" /></td>
    <td className="px-4 py-4"><div className="skeleton h-3.5 w-24 rounded" /></td>
    <td className="px-4 py-4"><div className="skeleton h-3.5 w-24 rounded" /></td>
    <td className="px-4 py-4"><div className="skeleton h-6 w-20 rounded-full" /></td>
    <td className="px-4 py-4"><div className="skeleton h-6 w-20 rounded-full" /></td>
    <td className="px-4 py-4 text-center"><div className="skeleton h-7 w-28 rounded-lg mx-auto" /></td>
  </tr>
);

// ─── Pagination ───────────────────────────────────────────────────────────────
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage, totalPages, totalElements, pageSize, onPageChange,
}) => {
  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalElements);

  const getPages = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (currentPage > 2) pages.push("...");
      for (
        let i = Math.max(1, currentPage - 1);
        i <= Math.min(totalPages - 2, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages - 1);
    }
    return pages;
  };

  return (
    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
      <p className="text-xs text-text-secondary-light ">
        Showing{" "}
        <span className="font-semibold text-text-primary-light ">
          {start}–{end}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-text-primary-light ">
          {totalElements}
        </span>{" "}
        employees
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-text-secondary-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Previous page"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 010 1.06L7.06 8l2.72 2.72a.75.75 0 11-1.06 1.06L5.47 8.53a.75.75 0 010-1.06l3.25-3.25a.75.75 0 011.06 0z" clipRule="evenodd" />
          </svg>
        </button>

        {getPages().map((page, idx) =>
          page === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-8 text-center text-sm text-text-secondary-light "
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer
              ${
                currentPage === page
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary-light hover:bg-gray-100 "
              }
              `}
            >
              {(page as number) + 1}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-text-secondary-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Next page"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EmployeeOffboarding: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [employees, setEmployees] = useState<OffboardingEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({
    totalElements: 0,
    totalPages: 1,
    size: 10,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchEmployees = useCallback(
    async (_pageNum: number) => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiClient.get<OffboardingEmployee[] | PageResponse<OffboardingEmployee>>(
          API_URL,
        );

        const data = res.data;

        if (Array.isArray(data)) {
          setEmployees(data);
          setPageInfo({
            totalElements: data.length,
            totalPages: 1,
            size: data.length || 10,
          });
        } else {
          const content = data.content ?? [];
          setEmployees(content);
          setPageInfo({
            totalElements: data.totalElements ?? content.length,
            totalPages: data.totalPages || 1,
            size: data.size || 10,
          });
        }
      } catch (err: unknown) {
        if (err instanceof Error && 'response' in err) {
          const axErr = err as { response?: { status: number; statusText: string } };
          const msg = axErr.response
            ? `Error ${axErr.response.status}: ${axErr.response.statusText}`
            : "Cannot connect to server. Please check the backend.";
          setError(msg);
          toastError("Failed to load offboarding list", msg);
        } else {
          setError("An unexpected error occurred.");
          toastError("Unexpected error", "Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [toastError],
  );

  useEffect(() => {
    fetchEmployees(page);
  }, [page, fetchEmployees]);

  // ── Selection ──────────────────────────────────────────────────────────────
  const allSelected =
    employees.length > 0 &&
    employees.every((e) => selectedIds.has(e.employeeId));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map((e) => e.employeeId)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Sort ───────────────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon: React.FC<{ field: string }> = ({ field }) => (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`w-3.5 h-3.5 transition-colors ${
        sortField === field
          ? "text-primary"
          : "text-gray-300 group-hover:text-gray-400"
      }`}
    >
      {sortField === field && sortDir === "asc" ? (
        <path
          fillRule="evenodd"
          d="M8 2a.75.75 0 01.75.75v8.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V2.75A.75.75 0 018 2z"
          clipRule="evenodd"
          style={{ transform: "rotate(180deg)", transformOrigin: "center" }}
        />
      ) : (
        <path
          fillRule="evenodd"
          d="M8 2a.75.75 0 01.75.75v8.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V2.75A.75.75 0 018 2z"
          clipRule="evenodd"
        />
      )}
    </svg>
  );

  // ── Column definitions ─────────────────────────────────────────────────────
  const COLUMNS = [
    { key: "fullName", label: "Employee", sortable: true },
    { key: "departmentName", label: "Department", sortable: true },
    { key: "positionTitle", label: "Position", sortable: true },
    { key: "dateOfJoining", label: "Date of Joining", sortable: true },
    { key: "employeeStatus", label: "Status", sortable: false },
    { key: "handoverStatus", label: "Handover Status", sortable: false },
  ];

  // ── Error state ────────────────────────────────────────────────────────────
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
            Check your backend connection and try again.
          </p>
        </div>
        <button
          onClick={() => fetchEmployees(page)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer btn-primary-action"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-light bg-surface-light overflow-hidden shadow-card animate-fade-in">

      {/* ── Bulk action bar ─────────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="px-6 py-3 bg-primary/5 border-b border-primary/20 flex items-center gap-4 animate-slide-up">
          <span className="text-sm font-semibold text-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs font-semibold text-text-secondary-light hover:text-text-primary-light border border-border-light rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              Export
            </button>
            <button className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer">
              Archive
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-text-secondary-light hover:text-text-primary-light transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-10 bg-surface-light ">
            <tr className="border-b border-gray-100 ">
              {/* Checkbox */}
              <th className="pl-6 pr-4 py-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-0 focus:ring-offset-0 bg-transparent cursor-pointer accent-primary"
                  aria-label="Select all"
                />
              </th>

              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light "
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1.5 hover:text-text-primary-light transition-colors cursor-pointer group"
                    >
                      {col.label}
                      <SortIcon field={col.key} />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}

              <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light text-center sticky right-0 bg-surface-light ">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50 text-sm">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : employees.map((emp) => {
                  const isSelected = selectedIds.has(emp.employeeId);

                  return (
                    <tr
                      key={emp.employeeId}
                      className={`table-row-hover group
                      ${
                        isSelected
                        ? "bg-primary/5 "
                        : "hover:bg-gray-50/80 "
                      }
                      `}
                    >
                      {/* Checkbox */}
                      <td className="pl-6 pr-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(emp.employeeId)}
                          className="w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-0 focus:ring-offset-0 bg-transparent cursor-pointer accent-primary"
                          aria-label={`Select ${emp.fullName}`}
                        />
                      </td>

                      {/* Employee Name + Code */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.fullName} url={emp.avatarUrl} />
                          <div>
                            <div
                              className="font-semibold text-text-primary-light leading-snug cursor-pointer hover:text-primary transition-colors"
                              onClick={() => navigate(`/employee/${emp.employeeId}`)}
                            >
                              {emp.fullName}
                            </div>
                            <div className="text-[11px] text-text-secondary-light font-mono mt-0.5">
                              {emp.employeeCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 text-text-primary-light ">
                        {emp.departmentName || (
                          <span className="text-text-muted-light ">—</span>
                        )}
                      </td>

                      {/* Position */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium text-text-secondary-light bg-gray-100 px-2 py-0.5 rounded-md">
                          {emp.positionTitle || "—"}
                        </span>
                      </td>

                      {/* Date of Joining */}
                      <td className="px-4 py-3.5 text-text-secondary-light tabular-nums">
                        {emp.dateOfJoining
                          ? new Date(emp.dateOfJoining).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : <span className="text-text-muted-light ">—</span>
                        }
                      </td>

                      {/* Employee Status (TERMINATED / RESIGNED) */}
                      <td className="px-4 py-3.5">
                        <EmployeeStatusBadge status={emp.employeeStatus} />
                      </td>

                      {/* Handover Status Badge */}
                      <td className="px-4 py-3.5">
                        <HandoverBadge status={"PENDING"} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center sticky right-0 bg-surface-light">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => navigate(`/employee/${emp.employeeId}`)}
                            title="View profile"
                            className="p-1.5 rounded-lg text-text-secondary-light hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                          >
                            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                              <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                              <path fillRule="evenodd" d="M1.38 8.28a1.2 1.2 0 010-.56 7.16 7.16 0 0113.24 0c.044.185.044.378 0 .56a7.16 7.16 0 01-13.24 0zM8 11a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {!loading && employees.length === 0 && (
        <div className="py-20 flex flex-col items-center gap-3 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-gray-400">
              <path fillRule="evenodd" d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12zm0-9a1 1 0 00-1 1v3a1 1 0 002 0V8a1 1 0 00-1-1zm0 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="font-semibold text-text-primary-light ">
            No offboarding employees
          </p>
          <p className="text-sm text-text-secondary-light ">
            Employees with TERMINATED or RESIGNED status will appear here.
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && pageInfo.totalElements > 0 && (
        <Pagination
          currentPage={page}
          totalPages={pageInfo.totalPages}
          totalElements={pageInfo.totalElements}
          pageSize={pageInfo.size}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default EmployeeOffboarding;
