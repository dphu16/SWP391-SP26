import React, { useState } from "react";
import type { OffboardingResponse } from "../../services/offboardingService";

interface HRConfirmOffboardingModalProps {
  isOpen: boolean;
  offboarding: OffboardingResponse | null;
  onConfirm: (officialLastDay: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const HRConfirmOffboardingModal: React.FC<HRConfirmOffboardingModalProps> = ({
  isOpen,
  offboarding,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [officialLastDay, setOfficialLastDay] = useState<string>("");
  const [error, setError] = useState<string>("");

  if (!isOpen || !offboarding) return null;

  const handleConfirm = async () => {
    // Validate date
    if (!officialLastDay) {
      setError("Please select an official last day");
      return;
    }

    // Validate that date is not in the past
    const selectedDate = new Date(officialLastDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setError("Official last day cannot be in the past");
      return;
    }

    try {
      setError("");
      await onConfirm(officialLastDay);
      setOfficialLastDay("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to confirm offboarding",
      );
    }
  };

  const handleClose = () => {
    setOfficialLastDay("");
    setError("");
    onCancel();
  };

  const typeLabel =
    {
      RESIGNATION: "Resignation",
      TERMINATED: "Termination",
      CONTRACT_EXPIRED: "Contract Expiration",
    }[offboarding.type] || offboarding.type;

  const expectedLastDay = offboarding.expectedLastDay
    ? new Date(offboarding.expectedLastDay).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  return (
    <>
      {/* Overlay with backdrop blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999]"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[1000] px-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0d9488] to-[#059669] px-6 py-4">
            <h2 className="text-xl font-bold text-white">
              Confirm Offboarding Request
            </h2>
            <p className="text-teal-100 text-sm mt-1">
              Set the official last working day
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-5">
            {/* Employee Info Card */}
            <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-[#4b5563] uppercase tracking-wider mb-1">
                    Employee
                  </p>
                  <p className="text-sm font-bold text-[#1e293b]">
                    {offboarding.employeeName}
                  </p>
                  <p className="text-xs text-[#64748b]">
                    {offboarding.employeeCode}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#ccfbf1]">
                  <div>
                    <p className="text-xs font-semibold text-[#4b5563] uppercase tracking-wider mb-1">
                      Type
                    </p>
                    <p className="text-sm font-semibold text-[#1e293b]">
                      {typeLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#4b5563] uppercase tracking-wider mb-1">
                      Expected
                    </p>
                    <p className="text-sm font-semibold text-[#1e293b]">
                      {expectedLastDay}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="text-xs font-semibold text-[#4b5563] uppercase tracking-wider mb-2">
                Reason
              </p>
              <p className="text-sm text-[#475569] italic">
                {offboarding.reason || "No reason provided"}
              </p>
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-xs font-semibold text-[#1e293b] uppercase tracking-wider mb-2">
                Official Last Day <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={officialLastDay}
                onChange={(e) => {
                  setOfficialLastDay(e.target.value);
                  setError("");
                }}
                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                disabled={isLoading}
              />
              <p className="text-xs text-[#64748b] mt-1.5">
                This will be recorded as the official last working day. A
                scheduled job will automatically complete the offboarding on
                this date.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-[#fee2e2] border border-[#fca5a5] rounded-lg p-3">
                <p className="text-xs font-medium text-[#991b1b]">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc]">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#334155] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || !officialLastDay}
              className="flex-1 px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Confirming...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Confirm
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default HRConfirmOffboardingModal;
