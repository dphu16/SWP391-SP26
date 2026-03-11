import React from "react";

const PayrollTab: React.FC = () => {
  return (
    <div className="rounded-2xl border border-border-light bg-surface-light shadow-card animate-fade-in">
      <div className="py-20 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-6 h-6 text-gray-400"
          >
            <path
              fillRule="evenodd"
              d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="font-semibold text-text-primary-light">
          No payroll data yet
        </p>
        <p className="text-sm text-text-secondary-light">
          Payroll information will appear here once configured.
        </p>
      </div>
    </div>
  );
};

export default PayrollTab;
