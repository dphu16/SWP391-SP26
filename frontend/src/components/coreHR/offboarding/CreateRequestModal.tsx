import React, { useState } from "react";

interface CreateRequestModalProps {
  onClose: () => void;
  onSubmit: (data: {
    type: string;
    reason: string;
    expectedLastDay?: string;
    employeeId?: string;
  }) => void;
  mode: "resign" | "propose";
  loading: boolean;
}

const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  onClose,
  onSubmit,
  mode,
  loading,
}) => {
  const [type, setType] = useState(
    mode === "resign" ? "RESIGNATION" : "TERMINATED",
  );
  const [reason, setReason] = useState("");
  const [expectedLastDay, setExpectedLastDay] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      reason,
      expectedLastDay: expectedLastDay || undefined,
      employeeId: mode === "propose" ? employeeId : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === "resign"
              ? "Create Resignation Request"
              : "Propose Offboarding"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "resign"
              ? "Request will be sent to Manager for approval"
              : "Request will be sent to HR for confirmation"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {mode === "propose" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                placeholder="Enter Employee UUID"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-0 focus:outline-none transition-colors"
              />
            </div>
          )}

          {mode === "propose" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-0 focus:outline-none transition-colors cursor-pointer"
              >
                <option value="TERMINATED">Terminated</option>
                <option value="CONTRACT_EXPIRED">
                  Contract Expired
                </option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="Enter reason..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-0 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Expected Last Day
            </label>
            <input
              type="date"
              value={expectedLastDay}
              onChange={(e) => setExpectedLastDay(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-0 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequestModal;
