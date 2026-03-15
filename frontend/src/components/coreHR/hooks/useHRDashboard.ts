import { useState, useEffect, useCallback } from "react";
import apiClient from "../../../services/apiClient";
import type { Employee, PageResponse } from "./types";
import { type DonutSlice } from "../dashboard/DonutChart";
import { buildStats, type DashboardStats } from "../dashboard/helpers";

export const useHRDashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    active: 0,
    onboarding: 0,
    onLeave: 0,
    probation: 0,
    inactive: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const firstPage = await apiClient.get<PageResponse<Employee>>(
        "/api/hr/employees",
        {
          params: { page: 0, size: 6, sort: "fullName" },
        },
      );
      setEmployees(firstPage.data.content);

      const totalPages = Math.min(firstPage.data.totalPages, 20);
      let allEmps: Employee[] = [...firstPage.data.content];

      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            apiClient.get<PageResponse<Employee>>("/api/hr/employees", {
              params: { page: i + 1, size: 10, sort: "fullName" },
            }),
          ),
        );
        rest.forEach((r) => allEmps.push(...r.data.content));
      }

      setAllEmployees(allEmps);
      setStats(buildStats(allEmps));
    } catch {
      // Keep empty state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const donutSlices: DonutSlice[] = [
    { value: stats.active, color: "#10b981", label: "Active" },
    { value: stats.onboarding, color: "#f59e0b", label: "Onboarding" },
    { value: stats.probation, color: "#3b82f6", label: "Probation" },
    { value: stats.onLeave, color: "#f43f5e", label: "On Leave" },
    { value: stats.inactive, color: "#94a3b8", label: "Inactive" },
  ].filter((s) => s.value > 0);

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    employees,
    allEmployees,
    loading,
    stats,
    donutSlices,
    today,
  };
};
