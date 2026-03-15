import { useState, useRef, useCallback, useEffect } from "react";
import apiClient from "../../../../services/apiClient";
import type { CreateNewHireDTO } from "../../hooks/types";

export interface ManagerOption {
  id: string;
  employeeCode: string;
  fullName: string;
  positionTitle: string;
  deptName: string;
}

export const useManagerSearch = (
  setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>>,
  clearFieldError: (field: string) => void
) => {
  const [managerQuery, setManagerQuery] = useState("");
  const [managerResults, setManagerResults] = useState<ManagerOption[]>([]);
  const [managerSearching, setManagerSearching] = useState(false);
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [selectedManagerName, setSelectedManagerName] = useState("");
  const managerRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const searchManagers = useCallback((query: string) => {
    if (query.trim().length < 2) {
      setManagerResults([]);
      setShowManagerDropdown(false);
      return;
    }

    setManagerSearching(true);
    const params: Record<string, string> = { page: "0", size: "10" };

    if (/^EMP[0-9]*$/i.test(query.trim())) {
      params.employeeCode = query.trim().toUpperCase();
    } else {
      params.fullName = query.trim();
    }

    apiClient
      .get<{ content: ManagerOption[] }>("/api/employees/search", { params })
      .then((res) => {
        setManagerResults(res.data.content || []);
        setShowManagerDropdown(true);
      })
      .catch(() => {
        setManagerResults([]);
      })
      .finally(() => {
        setManagerSearching(false);
      });
  }, []);

  const handleManagerQueryChange = (value: string) => {
    setManagerQuery(value);
    setSelectedManagerName("");
    setFormData((prev) => ({ ...prev, managerId: "" }));
    clearFieldError("managerId");

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => searchManagers(value), 400);
  };

  const handleSelectManager = (mgr: ManagerOption) => {
    setFormData((prev) => ({ ...prev, managerId: mgr.id }));
    setSelectedManagerName(`${mgr.fullName} (${mgr.employeeCode})`);
    setManagerQuery(`${mgr.fullName} (${mgr.employeeCode})`);
    setShowManagerDropdown(false);
    clearFieldError("managerId");
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (managerRef.current && !managerRef.current.contains(e.target as Node)) {
        setShowManagerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return {
    managerQuery,
    managerResults,
    managerSearching,
    showManagerDropdown,
    setShowManagerDropdown,
    selectedManagerName,
    managerRef,
    handleManagerQueryChange,
    handleSelectManager,
  };
};
