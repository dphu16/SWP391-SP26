import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import type { OffboardingEmployee, PageResponse } from "../types";
import { useToast } from "./ui/Toast";
import FilterBar from "./FilterBar";

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

// ─── Offboarding Tracker Modal ───────────────────────────────────────────────
const OffboardingTrackerModal: React.FC<{
  employee: OffboardingEmployee;
  onClose: () => void;
  onImmediateStatusChange: () => void;
}> = ({ employee, onClose, onImmediateStatusChange }) => {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "Thông báo cho nhân viên",
      description: "Gửi thông báo offboarding chính thức qua email và hệ thống.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
      )
    },
    {
      id: 2,
      title: "Tính lương sau khi nghỉ việc",
      description: "Quyết toán lương, phép năm và các khoản trợ cấp còn lại.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line><line x1="6" y1="16" x2="6.01" y2="16"></line><line x1="10" y1="16" x2="10.01" y2="16"></line></svg>
      )
    },
    {
      id: 3,
      title: "Chuyển trạng thái tài khoản",
      description: "Thu hồi quyền truy cập và vô hiệu hóa tài khoản hệ thống.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-fade-in">
      <div className="bg-surface-light w-full max-w-2xl rounded-2xl shadow-xl border border-border-light overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="relative px-8 py-6 border-b border-gray-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-text-primary-light">
                Theo dõi quá trình Offboarding
              </h2>
              <p className="text-sm font-medium text-text-secondary-light mt-1 flex items-center gap-2">
                <span className="text-primary">{employee.fullName}</span> 
                <span className="w-1 h-1 rounded-full bg-gray-300" /> 
                <span className="font-mono text-xs">{employee.employeeCode}</span>
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 pb-10">
          <div className="relative pl-2">
            {/* Connection Line */}
            <div className="absolute left-[34px] top-10 bottom-10 w-0.5 bg-gray-100" />
            
            <div className="space-y-10 relative">
              {steps.map((step) => {
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;
                
                return (
                  <div key={step.id} className="flex gap-6 relative group">
                    {/* Step Indicator */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-300 shadow-sm border-[3px]
                      ${isCompleted ? "bg-primary text-white border-primary" : 
                        isCurrent ? "bg-white text-primary border-primary shadow-md scale-110" : 
                        "bg-white text-gray-300 border-gray-100"}`}>
                      {isCompleted ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : step.icon}
                    </div>
                    
                    {/* Content */}
                    <div className={`flex-1 pt-2 transition-opacity duration-300 ${!isCurrent && !isCompleted ? "opacity-50 group-hover:opacity-80" : ""}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`text-[15px] font-bold ${isCurrent ? "text-primary" : "text-text-primary-light"}`}>
                          Giai đoạn {step.id}: {step.title}
                        </h3>
                        {/* Status Label */}
                        <div className="text-[10px] uppercase font-bold tracking-wider">
                          {isCompleted ? <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Đã xong</span> : 
                           isCurrent ? <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full">Đang xử lý</span> : 
                           <span className="text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Chờ xử lý</span>}
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary-light mt-1.5 leading-relaxed pr-8">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-text-muted-light">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span className="text-xs font-medium">Quá trình này có thể mất vài ngày làm việc.</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onImmediateStatusChange}
              className="px-5 py-2.5 bg-rose-50 text-rose-600 hover:text-white font-semibold text-sm rounded-xl hover:bg-rose-500 transition-all shadow-sm flex items-center gap-2 cursor-pointer group"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Chuyển trạng thái ngay
            </button>
          </div>
        </div>
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

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState({ category: "department", value: "All Departments" });

  const [trackingEmployee, setTrackingEmployee] = useState<OffboardingEmployee | null>(null);

  const handleImmediateStatusChange = () => {
    if (window.confirm("Bạn có chắc chắn muốn chuyển trạng thái nhân viên này ngay lập tức không?")) {
      // Logic call API here...
      setTrackingEmployee(null);
      fetchEmployees(page);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleFilterChange = (category: string, value: string) => {
    setFilter({ category, value });
  };

  const filteredEmployees = employees.filter(emp => {
    const nameStr = emp.fullName || "";
    const codeStr = emp.employeeCode || "";
    const matchesSearch = nameStr.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                         codeStr.toLowerCase().includes(debouncedSearch.toLowerCase());
                         
    let matchesFilter = true;
    if (filter.value && !filter.value.startsWith("All")) {
      switch (filter.category) {
        case "department":
          matchesFilter = emp.departmentName === filter.value;
          break;
        case "position":
          matchesFilter = emp.positionTitle === filter.value;
          break;
      }
    }
    
    return matchesSearch && matchesFilter;
  });

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

  // ── Action ─────────────────────────────────────────────────────────────────
  const handleReactivate = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to reactivate ${selectedIds.size} selected employee(s)?`)) return;

    try {
      setLoading(true);
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          apiClient.put(`/api/employees/${id}/activate`)
        )
      );
      setSelectedIds(new Set());
      await fetchEmployees(page);
    } catch (err: unknown) {
      toastError("Reactivation Failed", "Could not reactivate some employees.");
    } finally {
      setLoading(false);
    }
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
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary-light font-heading">
          Employee Offboarding
        </h1>
        <p className="text-text-secondary-light text-sm">
          Handle the offboarding process and handover tasks for departing employees.
        </p>
      </div>

      <FilterBar 
        onSearch={setSearchTerm} 
        onFilterChange={handleFilterChange}
      />

      <div className="rounded-2xl border border-border-light bg-surface-light overflow-hidden shadow-card animate-fade-in">

      {/* ── Bulk action bar ─────────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="px-6 py-3 bg-primary/5 border-b border-primary/20 flex items-center gap-4 animate-slide-up">
          <span className="text-sm font-semibold text-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReactivate}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            >
              Reactivate
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
              : filteredEmployees.map((emp) => {
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
                            <div className="font-semibold text-text-primary-light leading-snug">
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
                            onClick={() => setTrackingEmployee(emp)}
                            title="Theo dõi quá trình Offboarding"
                            className="p-1.5 rounded-lg text-primary hover:text-white hover:bg-primary transition-colors cursor-pointer group"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
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
      {!loading && filteredEmployees.length === 0 && (
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

      {/* Tracking Modal */}
      {trackingEmployee && (
        <OffboardingTrackerModal
          employee={trackingEmployee}
          onClose={() => setTrackingEmployee(null)}
          onImmediateStatusChange={handleImmediateStatusChange}
        />
      )}
    </div>
  </div>
  );
};

export default EmployeeOffboarding;
