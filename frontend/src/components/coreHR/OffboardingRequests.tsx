import React from "react";
import FilterBar from "../ui/FilterBar";
import CreateRequestModal from "./offboarding/CreateRequestModal";
import DetailModal from "./offboarding/DetailModal";
import OffboardingTable from "./offboarding/OffboardingTable";
import { useOffboardingRequests } from "./hooks/useOffboardingRequests";

const OFFBOARDING_FILTERS = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "All Status", value: "ALL" },
      { label: "Pending", value: "PENDING" },
      { label: "Approved by Mgr", value: "MANAGER_APPROVED" },
      { label: "Confirmed by HR", value: "HR_CONFIRMED" },
      { label: "Cancelled", value: "CANCELLED" },
      { label: "Completed", value: "COMPLETED" },
    ],
  },
  {
    key: "type",
    label: "Request Type",
    options: [
      { label: "All Types", value: "ALL" },
      { label: "Resignation", value: "RESIGNATION" },
      { label: "Special Proposal", value: "TERMINATED" },
      { label: "Contract Expired", value: "CONTRACT_EXPIRED" },
    ],
  },
];

const OffboardingRequests: React.FC = () => {
  const {
    filteredRequests,
    setSearchQuery,
    handleFilterChange,
    loading,
    showCreateModal,
    setShowCreateModal,
    submitting,
    selectedRequest,
    setSelectedRequest,
    handleCreateRequest,
  } = useOffboardingRequests();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Offboarding Requests
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage resignation, termination, and contract expiration requests
          </p>
        </div>
        <div className="flex items-center gap-2">
        </div>
      </div>

      <FilterBar 
        onSearch={setSearchQuery} 
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search by employee name or code..."
        filters={OFFBOARDING_FILTERS}
      />

      <OffboardingTable
        loading={loading}
        filteredRequests={filteredRequests}
        onViewDetail={setSelectedRequest}
      />

      {/* Modals */}
      {showCreateModal && (
        <CreateRequestModal
          mode="resign"
          loading={submitting}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRequest}
        />
      )}

      {selectedRequest && (
        <DetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
};

export default OffboardingRequests;
