import { useState, useEffect, useCallback } from "react";
import apiClient from "../../../services/apiClient";
import type { Employee, PageResponse } from "./types";
import { useToast } from "../../../components/ui/Toast";

const API_URL = "/api/hr/employees";

export const useEmployeeTable = (
  searchQuery?: string,
  filterCategory?: string,
  filterValue?: string,
) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({
    totalElements: 0,
    totalPages: 1,
    size: 10,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const fetchEmployees = useCallback(
    async (pageNum: number, currentSearch?: string) => {
      try {
        setLoading(true);
        setError(null);

        let endpoint = API_URL;
        const params: Record<string, unknown> = { page: pageNum, size: 10 };

        if (filterCategory && filterValue && !filterValue.startsWith("All")) {
          endpoint = "/api/employees/search";
          params[filterCategory] = filterValue;
        }

        if (currentSearch && currentSearch.trim() !== "") {
          endpoint = "/api/employees/search";
          const q = currentSearch.trim();
          if (/^\+?[\d\s\-]+$/.test(q)) {
            params.phoneNumber = q.replace(/\s+/g, "");
          } else if (/^EMP[0-9]+$/i.test(q)) {
            params.employeeCode = q.toUpperCase();
          } else {
            params.fullName = q;
          }
        }

        const res = await apiClient.get<PageResponse<Employee>>(endpoint, {
          params,
        });
        setEmployees(res.data.content);
        setPageInfo({
          totalElements: res.data.totalElements,
          totalPages: res.data.totalPages || 1,
          size: res.data.size || 10,
        });
      } catch (err: unknown) {
        if (err instanceof Error && "response" in err) {
          const axErr = err as {
            response?: { status: number; statusText: string };
          };
          const msg = axErr.response
            ? `Error ${axErr.response.status}: ${axErr.response.statusText}`
            : "Cannot connect to server. Please check the backend.";
          setError(msg);
          toastError("Failed to load employees", msg);
        } else {
          setError("An unexpected error occurred.");
          toastError("Unexpected error", "Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [toastError, filterCategory, filterValue],
  );

  useEffect(() => {
    fetchEmployees(page, searchQuery);
  }, [page, searchQuery, filterCategory, filterValue, fetchEmployees]);

  // ── Selection ──
  const allSelected =
    employees.length > 0 && employees.every((e) => selectedIds.has(e.id));

  const toggleAll = () => {
    setSelectedIds(
      allSelected ? new Set() : new Set(employees.map((e) => e.id)),
    );
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Deactivate ──
  const handleDeactivateSingle = async (emp: Employee) => {
    if (!window.confirm(`Are you sure you want to deactivate ${emp.fullName}?`))
      return;
    try {
      setLoading(true);
      await apiClient.put(`/api/employees/${emp.id}/terminate`);
      toastSuccess("Success", `Deactivated ${emp.fullName}.`);
      await fetchEmployees(page, searchQuery);
    } catch {
      toastError(
        "Deactivation Failed",
        `Could not deactivate ${emp.fullName}.`,
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Sort ──
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  return {
    employees,
    loading,
    error,
    page,
    setPage,
    pageInfo,
    selectedIds,
    setSelectedIds,
    sortField,
    sortDir,
    fetchEmployees,
    allSelected,
    toggleAll,
    toggleOne,
    handleDeactivateSingle,
    handleSort,
  };
};
