import React, { useState, useEffect } from "react";
import apiClient from "../services/apiClient";

interface FilterBarProps {
  onSearch?: (q: string) => void;
  onFilterChange?: (category: string, value: string) => void;
  onAddEmployee?: () => void;
}

const STATIC_ROLES = ["Manager", "HR", "Employee", "Finance", "Mentor"];

const FilterBar: React.FC<FilterBarProps> = ({ onSearch, onFilterChange, onAddEmployee }) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("department");
  const [value, setValue] = useState("All Departments");

  // Options state
  const [departments, setDepartments] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);

  useEffect(() => {
    // Fetch departments and positions
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
  }, []);

  const FILTER_DATA: Record<string, { label: string; options: string[] }> = {
    department: {
      label: "Department",
      options: ["All Departments", ...departments],
    },
    position: {
      label: "Position",
      options: ["All Positions", ...positions],
    },
    role: {
      label: "Role",
      options: ["All Roles", ...STATIC_ROLES],
    },
    status: {
      label: "Status",
      options: ["All Status", "Active", "Inactive"],
    },
  };

  const currentOptions = FILTER_DATA[category]?.options || [];

  const handleSearch = (val: string) => {
    setSearch(val);
    onSearch?.(val);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const firstOption = FILTER_DATA[newCategory]?.options[0] || "";
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
          placeholder="Search employees, departments, skills..."
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
      <div className="flex items-center gap-3">
        {/* Category Box */}
        <div className="relative min-w-[140px]">
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-3 bg-surface-light border border-border-light rounded-xl text-sm font-medium text-text-primary-light hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer outline-none"
          >
            {Object.keys(FILTER_DATA).map((key) => (
              <option key={key} value={key}>
                {FILTER_DATA[key].label}
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
              <option key={opt} value={opt}>
                {opt}
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
    </div>
  );
};

export default FilterBar;
