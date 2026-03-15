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
    createMode,
    setCreateMode,
    submitting,
    selectedRequest,
    setSelectedRequest,
    isManager,
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
          {isManager && (
            <button
              onClick={() => {
                setCreateMode("propose");
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 border-2 border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Propose Offboarding
            </button>
          )}
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
          mode={createMode}
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
