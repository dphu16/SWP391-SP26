import React, { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterCategory {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterBarProps {
  onSearch?: (q: string) => void;
  onFilterChange?: (category: string, value: string) => void;
  onAddEmployee?: () => void;
  searchPlaceholder?: string;
  filters?: FilterCategory[];
  filterKeys?: string[];
  hideFilters?: boolean;
}

const STATIC_ROLES = ["Manager", "HR", "Employee", "Finance", "Mentor", "Intern", "Probation"];

const FilterBar: React.FC<FilterBarProps> = ({ 
  onSearch, 
  onFilterChange,
  searchPlaceholder = "Search employees, departments, skills...",
  filters,
  filterKeys,
  hideFilters = false,
}) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");

  // Options state
  const [departments, setDepartments] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);

  useEffect(() => {
    if (filters || hideFilters) return;
    const fetchOptions = async () => {
      try {
        const [deptRes, posRes] = await Promise.all([
          apiClient.get("/api/lookup/departments"),
          apiClient.get("/api/lookup/positions"),
        ]);
        setDepartments(deptRes.data.map((d: any) => d.name));
        setPositions(posRes.data.map((p: any) => p.title));
      } catch (err) {
        console.error("Failed to load options", err);
      }
    };
    fetchOptions();
  }, [filters, hideFilters]);

  const defaultFilters: FilterCategory[] = [
    {
      key: "department",
      label: "Department",
      options: [{ label: "All Departments", value: "All Departments" }, ...departments.map((v) => ({ label: v, value: v }))],
    },
    {
      key: "position",
      label: "Position",
      options: [{ label: "All Positions", value: "All Positions" }, ...positions.map((v) => ({ label: v, value: v }))],
    },
    {
      key: "role",
      label: "Role",
      options: [{ label: "All Roles", value: "All Roles" }, ...STATIC_ROLES.map((v) => ({ label: v, value: v }))],
    },
    {
      key: "status",
      label: "Status",
      options: [
        { label: "All Status", value: "All Status" },
        { label: "Official", value: "OFFICIAL" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Pending Review", value: "PENDING_REVIEW" },
        { label: "Pending Verify", value: "PENDING_VERIFY" },
        { label: "Pending Activation", value: "PENDING_ACTIVATION" },
        { label: "Rejected", value: "REJECTED" },
        { label: "New", value: "NEW" },
      ],
    },
  ];

  const activeFilters = filters || (filterKeys ? defaultFilters.filter(f => filterKeys.includes(f.key)) : defaultFilters);

  useEffect(() => {
    if (!hideFilters && activeFilters.length > 0 && !category) {
      setCategory(activeFilters[0].key);
      const firstOpt = activeFilters[0].options[0]?.value || "";
      setValue(firstOpt);
    }
  }, [activeFilters, hideFilters, category]);

  const currentCategoryObj = activeFilters.find((f) => f.key === category) || activeFilters[0];
  const currentOptions = currentCategoryObj?.options || [];

  const handleSearch = (val: string) => {
    setSearch(val);
    onSearch?.(val);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const newCatObj = activeFilters.find((f) => f.key === newCategory);
    const firstOption = newCatObj?.options[0]?.value || "";
    setValue(firstOption);
    onFilterChange?.(newCategory, firstOption);
  };

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onFilterChange?.(category, newValue);
  };

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full bg-surface-light p-1 rounded-2xl shadow-sm border border-border-light/50">
      {/* 1. Search Bar - flex-grow */}
      <div className="relative flex-grow group">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary-light group-focus-within:text-primary transition-colors duration-200 pointer-events-none">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-11 pr-10 py-3 bg-background-light/50 border-none rounded-xl text-sm text-text-primary-light placeholder-text-secondary-light focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200 outline-none"
        />
        {search && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted-light hover:text-text-primary-light transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 2 & 3. Filter Boxes */}
      {!hideFilters && activeFilters.length > 0 && (
        <div className="flex items-center gap-3">
          {/* Category Box */}
          <div className="relative min-w-[140px]">
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-3 bg-surface-light border border-border-light rounded-xl text-sm font-medium text-text-primary-light hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer outline-none"
            >
              {activeFilters.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary-light">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </div>

          {/* Value Box */}
          <div className="relative min-w-[160px]">
            <select
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-3 bg-surface-light border border-border-light rounded-xl text-sm font-medium text-text-primary-light hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer outline-none"
            >
              {currentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary-light">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-8 bg-border-light mx-1" />
        </div>
      )}
    </div>
  );
};

export default FilterBar;
