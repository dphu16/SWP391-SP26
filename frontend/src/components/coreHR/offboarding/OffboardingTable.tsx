import React from "react";
import type { OffboardingResponse } from "../../../services/offboardingService";
import Avatar from "../shared/Avatar";
import StatusBadge from "../shared/StatusBadge";
import SkeletonRow from "./SkeletonRow";
import { OFFBOARDING_REQUEST_STATUS_CONFIG, TYPE_LABELS } from "./constants";

interface OffboardingTableProps {
  loading: boolean;
  filteredRequests: OffboardingResponse[];
  onViewDetail: (request: OffboardingResponse) => void;
}

const OffboardingTable: React.FC<OffboardingTableProps> = ({
  loading,
  filteredRequests,
  onViewDetail,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Request Date
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Expected Last Day
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-16 text-center text-sm text-gray-400"
                >
                  No offboarding requests found
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr
                  key={req.offboardingId}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={req.employeeName} url={req.avatarUrl} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {req.employeeName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {req.employeeCode}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-700">
                      {TYPE_LABELS[req.type] ?? req.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-600">
                      {req.requestDate}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge
                      status={req.status}
                      config={OFFBOARDING_REQUEST_STATUS_CONFIG}
                      fallbackKey="PENDING"
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-600">
                      {req.expectedLastDay ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => onViewDetail(req)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center border border-primary/20"
                      title="Details"
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
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OffboardingTable;
