import React, { useState } from "react";
import { createPortal } from "react-dom";
import type { Employee } from "../hooks/types";

interface BulkDeactivateModalProps {
  onClose: () => void;
  onSubmit: (employeeData: { id: string; reason: string }[]) => void;
  employees: Employee[];
  loading?: boolean;
}

const BulkDeactivateModal: React.FC<BulkDeactivateModalProps> = ({
  onClose,
  onSubmit,
  employees,
  loading = false,
}) => {
  // Initialize state string for each chosen employee
  const [reasons, setReasons] = useState<{ [id: string]: string }>(
    employees.reduce((acc, emp) => {
      acc[emp.id] = "";
      return acc;
    }, {} as { [id: string]: string })
  );

  const handleReasonChange = (id: string, val: string) => {
    setReasons((prev) => ({ ...prev, [id]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = employees.map((emp) => ({
      id: emp.id,
      reason: reasons[emp.id] || "HR proposed offboarding",
    }));
    onSubmit(data);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">
            Propose Offboarding
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Provide a reason for each selected employee to propose offboarding.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-5 overflow-y-auto space-y-4 flex-1">
            {employees.map((emp) => (
              <div key={emp.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {emp.fullName}{" "}
                  <span className="text-gray-400 font-normal ml-1">
                    ({emp.employeeCode})
                  </span>
                </label>
                <textarea
                  value={reasons[emp.id]}
                  onChange={(e) => handleReasonChange(emp.id, e.target.value)}
                  required
                  rows={2}
                  placeholder={`Reason for ${emp.fullName}...`}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-0 focus:outline-none transition-colors resize-none bg-white"
                />
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/30 flex-shrink-0 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-green-400 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Submitting..." : "Submit Proposals"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default BulkDeactivateModal;
