import React from "react";
import type { Application } from "../hooks/types";
import { Avatar } from "../shared";

const STEPS = [
  { key: "PENDING_REVIEW", label: "Manager Review" },
  { key: "PENDING_VERIFY", label: "Verification" },
  { key: "PENDING_ACTIVATION", label: "Activation" },
  { key: "PASSWORD_CREATED", label: "Password Set" },
  { key: "COMPLETED", label: "Completed" },
];

const StatusModal: React.FC<{
  app: Application | null;
  onClose: () => void;
  onResubmit?: (app: Application) => void;
  onCancel?: (app: Application) => void;
}> = ({ app, onClose, onResubmit, onCancel }) => {
  if (!app) return null;

  const currentIndex = STEPS.findIndex((s) => s.key === app.progressStatus);
  const isRejected = app.progressStatus === "REJECTED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-text-primary-light">
            Onboarding Status
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 text-gray-400"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={app.candidateName || "?"} />
            <div>
              <p className="font-semibold text-text-primary-light">
                {app.candidateName}
              </p>
              <p className="text-xs text-text-secondary-light">
                {app.jobTitle || "—"}
              </p>
            </div>
          </div>
        </div>

        {isRejected ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-sm font-semibold text-rose-700">
                Rejected by Manager
              </span>
            </div>
            {app.rejectionReason && (
              <p className="text-sm text-rose-600 ml-4 mb-3">
                {app.rejectionReason}
              </p>
            )}
            <button
              onClick={() => {
                if (onResubmit) onResubmit(app);
                onClose();
              }}
              className="w-full py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
            >
              Edit & Resubmit
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {STEPS.map((step, idx) => {
              const isDone = currentIndex >= idx;
              const isCurrent = currentIndex === idx;
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDone
                          ? "bg-primary text-white"
                          : isCurrent
                            ? "bg-primary/20 text-primary border-2 border-primary"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isDone ? (
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-3.5 h-3.5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="text-[10px] font-bold">{idx + 1}</span>
                      )}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`w-0.5 h-6 ${isDone ? "bg-primary" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                  <div className="pt-1">
                    <p
                      className={`text-sm font-medium ${isDone ? "text-text-primary-light" : "text-gray-400"}`}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {onCancel && (
          <button
            onClick={() => {
              onCancel(app);
            }}
            className="mt-5 w-full py-2.5 rounded-xl border border-rose-200 bg-white text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            Cancel Onboarding
          </button>
        )}

        <button
          onClick={onClose}
          className="mt-3 w-full py-2.5 rounded-xl bg-gray-100 text-sm font-semibold text-text-primary-light hover:bg-gray-200 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default StatusModal;
