import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../services/apiClient";
import type { Application, OnboardingListResponse } from "./types";

const API_URL = "/api/applications/hired";

export const useHiredApplications = (
  onAction?: (employeeId: string, actionType: "init" | "continue") => void,
) => {
  const navigate = useNavigate();
  const [hiredApplications, setHiredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState({
    category: "department",
    value: "All Departments",
  });

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleFilterChange = (category: string, value: string) => {
    setFilter({ category, value });
  };

  const filterList = (list: Application[]) =>
    list.filter((app) => {
      const nameStr = app.candidateName || "";
      const emailStr = app.candidateEmail || "";
      const matchesSearch =
        nameStr.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        emailStr.toLowerCase().includes(debouncedSearch.toLowerCase());

      let matchesFilter = true;
      if (filter.value && !filter.value.startsWith("All")) {
        switch (filter.category) {
          case "position":
            matchesFilter = app.jobTitle === filter.value;
            break;
        }
      }
      return matchesSearch && matchesFilter;
    });

  const filteredHired = filterList(hiredApplications);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<OnboardingListResponse>(API_URL);
      setHiredApplications(response.data.hiredApplications ?? []);
    } catch (err: unknown) {
      if (err instanceof Error && "response" in err) {
        const axErr = err as {
          response?: { status: number; statusText: string };
        };
        setError(
          axErr.response
            ? `Error ${axErr.response.status}: ${axErr.response.statusText}`
            : "Cannot connect to server. Please check the backend.",
        );
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = (app: Application, actionType: "init" | "continue") => {
    const params = new URLSearchParams({
      name: app.candidateName || "",
      email: app.candidateEmail || "",
      phone: app.candidatePhone || "",
      job: app.jobTitle || "",
      action: actionType,
    });
    navigate(`/onboarding/${app.id}/profile?${params.toString()}`);
    if (onAction) onAction(app.id, actionType);
  };

  return {
    loading,
    error,
    filteredHired,
    setSearchTerm,
    handleFilterChange,
    handleAction,
  };
};
