import React from "react";
import { STEPS } from "./constants";

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path
      fillRule="evenodd"
      d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
      clipRule="evenodd"
    />
  </svg>
);

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.slice(1).map((s) => {
        const isCompleted = currentStep > s.id;
        const isActive = currentStep === s.id;
        return (
          <React.Fragment key={s.id}>
            {s.id > 1 && (
              <div
                className={`h-0.5 w-8 rounded-full transition-colors ${
                  currentStep >= s.id ? "bg-blue-500" : "bg-gray-200"
                }`}
              />
            )}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                isCompleted
                  ? "bg-blue-500 border-blue-500 text-white"
                  : isActive
                    ? "border-blue-500 text-blue-600 bg-white"
                    : "border-gray-300 text-gray-400 bg-white"
              }`}
            >
              {isCompleted ? <CheckIcon /> : s.id}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
