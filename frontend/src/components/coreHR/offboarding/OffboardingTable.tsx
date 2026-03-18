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
    <div className="rounded-2xl border border-border-light bg-surface-light overflow-hidden shadow-card animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f8fafc] border-b border-border-light">
            <tr>
              <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
                Employee
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
                Type
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
                Request Date
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
                Status
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
                Expected Last Day
              </th>
              <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center text-sm text-text-muted-light italic font-medium"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-10 h-10 text-gray-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>No offboarding requests found</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr
                  key={req.offboardingId}
                  className="table-row-hover group hover:bg-gray-50/80 transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={req.employeeName} url={req.avatarUrl} />
                      <div>
                        <div className="font-semibold text-text-primary-light leading-snug">
                          {req.employeeName}
                        </div>
                        <div className="text-[11px] text-text-secondary-light font-mono mt-0.5">
                          {req.employeeCode}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-text-primary-light font-medium">
                    {TYPE_LABELS[req.type] ?? req.type}
                  </td>
                  <td className="px-4 py-3.5 text-text-secondary-light">
                    {req.requestDate}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge
                      status={req.status}
                      config={OFFBOARDING_REQUEST_STATUS_CONFIG}
                      fallbackKey="PENDING"
                    />
                  </td>
                  <td className="px-4 py-3.5 text-text-secondary-light font-medium">
                    {req.expectedLastDay ?? (
                      <span className="text-text-muted-light">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <button
                      onClick={() => onViewDetail(req)}
                      className="p-1.5 rounded-lg text-text-secondary-light hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                      title="View Details"
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
