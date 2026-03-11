import React from "react";
import { CheckIcon, VerifiedIcon, STEPS } from "./formConstants";

interface StepNavigatorProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  submitting: boolean;
  isResubmit: boolean;
  onSubmit: () => void;
}

const StepNavigator: React.FC<StepNavigatorProps> = ({
  currentStep,
  setCurrentStep,
  submitting,
  isResubmit,
  onSubmit,
}) => (
  <div className="rounded-2xl border border-border-light bg-surface-light shadow-card overflow-hidden animate-fade-in">
    <div className="px-4 py-3.5 border-b border-border-light">
      <p className="text-xs font-bold text-text-primary-light uppercase tracking-wider">
        Onboarding Steps
      </p>
    </div>

    <div className="divide-y divide-gray-50">
      {STEPS.map((step, index) => {
        const isActive = currentStep === index;
        const isCompleted = currentStep > index;

        return (
          <button
            key={step.id}
            disabled={index > currentStep && !isCompleted}
            onClick={() => {
              if (index < currentStep || isCompleted) setCurrentStep(index);
            }}
            className={`w-full text-left px-4 py-4 transition-colors flex items-center gap-3 relative ${
              index <= currentStep
                ? "cursor-pointer hover:bg-gray-50"
                : "cursor-not-allowed opacity-50"
            } ${isActive ? "bg-primary/5" : ""}`}
          >
            {/* Active bar */}
            {isActive && (
              <span className="absolute left-0 top-3 bottom-3 w-0.5 bg-primary rounded-r-full" />
            )}

            {/* Circle */}
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                isCompleted
                  ? "border-primary bg-primary text-white"
                  : isActive
                    ? "border-primary text-primary"
                    : "border-gray-300 text-gray-300"
              }`}
            >
              {isCompleted ? <CheckIcon /> : <span>{step.icon}</span>}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <span
                className={`text-xs block font-semibold truncate ${
                  isActive
                    ? "text-text-primary-light"
                    : isCompleted
                      ? "text-text-secondary-light line-through decoration-gray-400"
                      : "text-text-primary-light"
                }`}
              >
                {step.title}
              </span>
              {isActive && (
                <p className="text-[11px] text-text-secondary-light mt-0.5 truncate">
                  {step.description}
                </p>
              )}
            </div>

            {/* Badge */}
            {isCompleted && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 whitespace-nowrap">
                Done
              </span>
            )}
            {isActive && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 whitespace-nowrap">
                Active
              </span>
            )}
            {!isCompleted && !isActive && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 text-text-muted-light whitespace-nowrap">
                Pending
              </span>
            )}
          </button>
        );
      })}
    </div>

    {/* Submit CTA */}
    <div className="p-4 border-t border-border-light">
      <button
        className={`w-full py-2.5 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm ${
          currentStep === STEPS.length - 1
            ? "bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 cursor-pointer btn-primary-action"
            : "bg-gray-100 text-text-muted-light cursor-not-allowed"
        }`}
        disabled={currentStep !== STEPS.length - 1 || submitting}
        onClick={onSubmit}
      >
        <VerifiedIcon />
        {submitting
          ? "Processing…"
          : isResubmit
            ? "Update & Resubmit"
            : "Finish & Create Employee"}
      </button>
      <p className="text-[11px] text-text-secondary-light mt-2 text-center">
        Complete all 2 steps to activate
      </p>
    </div>
  </div>
);

export default StepNavigator;
