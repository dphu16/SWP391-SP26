import React, { useState, useRef, useEffect } from "react";

interface FilterBarProps {
  onSearch?: (q: string) => void;
  onStatusChange?: (status: string) => void;
  onAddEmployee?: () => void;
}

const STATUS_OPTIONS = ["All Status", "Active", "Onboarding", "Probation", "On Leave", "Inactive"];

const FilterBar: React.FC<FilterBarProps> = ({ onSearch, onStatusChange, onAddEmployee }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Status");
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    onSearch?.(val);
  };

  const handleStatus = (val: string) => {
    setStatus(val);
    setStatusOpen(false);
    onStatusChange?.(val);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm group">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark group-focus-within:text-primary transition-colors pointer-events-none">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, code, department…"
          className="w-full pl-10 pr-4 py-2.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          aria-label="Search employees"
        />
        {search && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Department select */}
        <div className="relative">
          <select
            className="appearance-none pl-3 pr-8 py-2.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm font-medium text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
            aria-label="Filter by department"
          >
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Sales</option>
            <option>Marketing</option>
            <option>HR</option>
            <option>Finance</option>
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary-light dark:text-text-secondary-dark">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </span>
        </div>

        {/* Status custom dropdown */}
        <div className="relative" ref={statusRef}>
          <button
            onClick={() => setStatusOpen((o) => !o)}
            className={`flex items-center gap-2 pl-3 pr-3 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer
              ${statusOpen
                ? "bg-surface-light dark:bg-surface-dark border-primary ring-2 ring-primary/20 text-text-primary-light dark:text-text-primary-dark"
                : "bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark hover:border-gray-300 dark:hover:border-gray-600"
              }
            `}
            aria-haspopup="listbox"
            aria-expanded={statusOpen}
          >
            {status !== "All Status" && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            )}
            <span>{status}</span>
            <svg viewBox="0 0 16 16" fill="currentColor" className={`w-3.5 h-3.5 text-text-secondary-light dark:text-text-secondary-dark transition-transform duration-200 ${statusOpen ? "rotate-180" : ""}`}>
              <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {statusOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-dropdown py-1.5 z-30 animate-scale-in">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleStatus(opt)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-sm transition-colors cursor-pointer
                    ${status === opt
                      ? "text-primary font-semibold bg-primary/5"
                      : "text-text-primary-light dark:text-text-primary-dark hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    }
                  `}
                  role="option"
                  aria-selected={status === opt}
                >
                  {opt}
                  {status === opt && (
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-primary">
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border-light dark:bg-border-dark" />

        {/* Add Employee */}
        <button
          onClick={onAddEmployee}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer btn-primary-action shadow-sm"
          aria-label="Add new employee"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            <path d="M8.75 3.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" />
          </svg>
          <span className="hidden sm:inline">Add Employee</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
