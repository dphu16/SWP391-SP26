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
  const [isBulkDeactivateModalOpen, setIsBulkDeactivateModalOpen] = useState(false);
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
          const cleanQ = q.replace(/\s+/g, "");
          if (/^(0|\+84)\d{8,9}$/.test(cleanQ)) {
            params.phoneNumber = cleanQ;
          } else if (/^EMP[0-9]+$/i.test(q)) {
            params.employeeCode = q.toUpperCase();
          } else {
            params.fullName = q; // Assume full name for anything else
          }
        }

        const res = await apiClient.get<PageResponse<Employee>>(endpoint, {
          params,
        });
        setEmployees(res.data.content);
        // Spring Boot 3.x nests pagination info inside "page" object
        const pg = res.data.page;
        setPageInfo({
          totalElements: pg?.totalElements ?? 0,
          totalPages: pg?.totalPages || 1,
          size: pg?.size || 10,
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

  // Reset to page 0 whenever search or filter criteria change
  useEffect(() => {
    if (page !== 0) {
      setPage(0); // This triggers the effect below which will re-fetch
    } else {
      fetchEmployees(0, searchQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterCategory, filterValue]);

  // Fetch when page changes (including the reset above)
  useEffect(() => {
    fetchEmployees(page, searchQuery);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
    const reason = window.prompt(`Are you sure you want to propose offboarding for ${emp.fullName}? Please enter a reason:`);
    if (reason === null) return;
    try {
      setLoading(true);
      await apiClient.post(`/api/offboarding/propose/${emp.id}`, {
        type: "TERMINATED",
        reason: reason || "HR proposed offboarding",
        expectedLastDay: new Date().toISOString().split('T')[0]
      });
      toastSuccess("Success", `Proposed offboarding for ${emp.fullName}.`);
      await fetchEmployees(page, searchQuery);
    } catch (err: unknown) {
      if (err instanceof Error && "response" in err) {
        const axErr = err as {
          response?: { data: { message: string, error: string } };
        };
        const errMsg = axErr.response?.data?.message || axErr.response?.data?.error;
        if (errMsg) {
          toastError("Proposal Failed", errMsg);
          return;
        }
      }
      toastError(
        "Proposal Failed",
        `Could not propose offboarding for ${emp.fullName}.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateMultiple = () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeactivateModalOpen(true);
  };

  const submitDeactivateMultiple = async (employeeData: { id: string; reason: string }[]) => {
    try {
      setLoading(true);
      const promises = employeeData.map((data) =>
        apiClient.post(`/api/offboarding/propose/${data.id}`, {
          type: "TERMINATED",
          reason: data.reason || "HR proposed offboarding",
          expectedLastDay: new Date().toISOString().split("T")[0],
        }),
      );

      await Promise.all(promises);
      toastSuccess(
        "Success",
        `Proposed offboarding for ${employeeData.length} employees.`,
      );
      setSelectedIds(new Set());
      setIsBulkDeactivateModalOpen(false);
      await fetchEmployees(page, searchQuery);
    } catch (err: unknown) {
      toastError(
        "Proposal Failed",
        "Could not propose offboarding for some or all selected employees.",
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
    handleDeactivateMultiple,
    isBulkDeactivateModalOpen,
    setIsBulkDeactivateModalOpen,
    submitDeactivateMultiple,
    handleSort,
  };
};
