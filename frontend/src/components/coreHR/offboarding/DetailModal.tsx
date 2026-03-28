import React from "react";
import type { OffboardingResponse } from "../../../services/offboardingService";
import StatusBadge from "../shared/StatusBadge";
import { OFFBOARDING_REQUEST_STATUS_CONFIG, TYPE_LABELS } from "./constants";

interface DetailModalProps {
  request: OffboardingResponse;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ request, onClose }) => {
  const steps = [
    {
      label: "Request Created",
      date: request.requestDate,
      by: request.requestedByName,
      done: true,
    },
    {
      label: "Manager Approval",
      date: request.managerApprovedDate,
      by: request.approvedByManagerName,
      done: !!request.approvedByManager,
    },
    {
      label: "HR Confirmation",
      date: request.hrConfirmedDate,
      by: request.confirmedByHrName,
      done: !!request.confirmedByHr,
    },
    {
      label: "Completed",
      date: request.officialLastDay,
      by: null,
      done: request.status === "COMPLETED",
    },
  ];

  const isSelfResign = request.type === "RESIGNATION";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Offboarding Request Details
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {request.employeeName} - {request.employeeCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500">Type</span>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {TYPE_LABELS[request.type] ?? request.type}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Status</span>
              <div className="mt-0.5">
                <StatusBadge 
                  status={request.status} 
                  config={OFFBOARDING_REQUEST_STATUS_CONFIG} 
                  fallbackKey="PENDING" 
                />
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Expected Last Day</span>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {request.expectedLastDay ?? "—"}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">
                Official Last Day
              </span>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {request.officialLastDay ?? "—"}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <span className="text-xs text-gray-500">Reason</span>
            <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg">
              {request.reason}
            </p>
          </div>

          {/* Cancel info */}
          {request.status === "CANCELLED" && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
              <span className="text-xs font-semibold text-rose-700">
                Cancelled by: {request.cancelledByName} ({request.cancelledDate})
              </span>
              <p className="text-sm text-rose-600 mt-1">
                {request.cancelReason}
              </p>
            </div>
          )}

          {/* Timeline Steps */}
          <div>
            <span className="text-xs text-gray-500 block mb-3">Timeline</span>
            <div className="space-y-0">
              {(isSelfResign ? steps : [steps[0], steps[2], steps[3]]).map(
                (step, idx, arr) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          step.done ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                      />
                      {idx < arr.length - 1 && (
                        <div
                          className={`w-0.5 h-8 ${
                            step.done ? "bg-emerald-300" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-4 -mt-0.5">
                      <p
                        className={`text-sm font-medium ${
                          step.done ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.date && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {step.date}
                          {step.by && ` — ${step.by}`}
                        </p>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
