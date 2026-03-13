import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../services/apiClient";
import type { Application, OnboardingListResponse } from "./types";

const API_URL = "/api/applications/hired";

export const useEmployeeOnboarding = () => {
  const navigate = useNavigate();
  const [onboardingEmployees, setOnboardingEmployees] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusModalApp, setStatusModalApp] = useState<Application | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState({
    category: "status",
    value: "All Progress",
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
          case "status":
            matchesFilter = app.progressStatus === filter.value;
            break;
        }
      }
      return matchesSearch && matchesFilter;
    });

  const filteredOnboarding = filterList(onboardingEmployees);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<OnboardingListResponse>(API_URL);
      setOnboardingEmployees(response.data.onboardingEmployees ?? []);
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

  const handleResubmit = (app: Application) => {
    navigate(`/onboarding/${app.id}/profile?action=resubmit`);
  };

  return {
    loading,
    error,
    filteredOnboarding,
    searchTerm,
    setSearchTerm,
    handleFilterChange,
    statusModalApp,
    setStatusModalApp,
    handleResubmit,
  };
};
