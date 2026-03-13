import { useState, useEffect, useCallback, useMemo } from "react";
import {
  offboardingService,
  type OffboardingResponse,
} from "../../../services/offboardingService";
import { useToast } from "../../../components/ui/Toast";
import { useAuth } from "../../../hooks/useAuth";

export const useOffboardingRequests = () => {
  const [requests, setRequests] = useState<OffboardingResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<"resign" | "propose">("resign");
  const [submitting, setSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<OffboardingResponse | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");

  const { success, error: toastError } = useToast();
  const auth = useAuth();
  const isManager = auth?.hasRole("MANAGER");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await offboardingService.getActiveRequests();
      setRequests(res.data);
    } catch {
      toastError("Error", "Failed to load offboarding requests");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCreateRequest = async (data: {
    type: string;
    reason: string;
    expectedLastDay?: string;
    employeeId?: string;
  }) => {
    setSubmitting(true);
    try {
      const payload = {
        type: data.type,
        reason: data.reason,
        expectedLastDay: data.expectedLastDay,
      };

      if (createMode === "resign") {
        const empId = auth?.user?.employeeId;
        if (!empId) return;
        await offboardingService.createResignation(empId, payload);
        success("Success", "Resignation request created");
      } else {
        if (!data.employeeId) return;
        await offboardingService.createManagerProposal(
          data.employeeId,
          payload,
        );
        success("Success", "Offboarding proposal created");
      }

      setShowCreateModal(false);
      fetchRequests();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create request";
      toastError("Error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchStatus = filterStatus === "ALL" || r.status === filterStatus;
      const matchType = filterType === "ALL" || r.type === filterType;
      const matchSearch =
        searchQuery === "" ||
        r.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchType && matchSearch;
    });
  }, [requests, filterStatus, filterType, searchQuery]);

  const handleFilterChange = useCallback((category: string, value: string) => {
    if (category === "status") {
      setFilterStatus(value);
    } else if (category === "type") {
      setFilterType(value);
    }
  }, []);

  return {
    requests,
    filteredRequests,
    searchQuery,
    setSearchQuery,
    loading,
    showCreateModal,
    setShowCreateModal,
    createMode,
    setCreateMode,
    submitting,
    selectedRequest,
    setSelectedRequest,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    handleFilterChange,
    isManager,
    handleCreateRequest,
  };
};
