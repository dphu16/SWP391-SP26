import React from "react";
import {
  STEPS,
  ArrowLeftIcon,
  ArrowRightIcon,
  VerifiedIcon,
  ErrorIcon,
} from "./onboarding/formConstants";
import InlineToast from "./onboarding/InlineToast";
import PersonalInfoForm from "./onboarding/PersonalInfoForm";
import EmploymentDetailsForm from "./onboarding/EmploymentDetailsForm";
import CandidateCard from "./onboarding/CandidateCard";
import StepNavigator from "./onboarding/StepNavigator";
import { useCandidateOnboarding } from "./hooks/useCandidateOnboarding";

const CandidateProfileCompletion: React.FC = () => {
  const {
    applicationId,
    jobTitle,
    jobId,
    isResubmit,
    currentStep,
    setCurrentStep,
    submitting,
    submitError,
    loadingEmployee,
    toast,
    setToast,
    formData,
    setFormData,
    fieldErrors,
    clearFieldError,
    handleNext,
    handleBack,
    handleGoBack,
    handleSubmit,
  } = useCandidateOnboarding();

  const progressPct = Math.round((currentStep / STEPS.length) * 100);

  return (
    <>
      {toast && (
        <InlineToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="pt-6">
        {loadingEmployee ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-text-secondary-light">
              Loading employee data…
            </span>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Left Column */}
              <div className="w-full lg:w-72 lg:flex-shrink-0 lg:sticky lg:top-6 flex flex-col gap-4">
                <CandidateCard
                  formData={formData}
                  jobTitle={jobTitle}
                  progressPct={progressPct}
                  applicationId={applicationId}
                />
                <StepNavigator
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                />
              </div>

              {/* Right Column: Main Form */}
              <div className="flex-1 min-w-0">
                <div className="rounded-2xl border border-border-light bg-surface-light shadow-card overflow-hidden animate-fade-in">
                  <div className="p-6 md:p-8 min-h-[520px]">
                    {currentStep === 0 && (
                      <PersonalInfoForm
                        formData={formData}
                        setFormData={setFormData}
                        fieldErrors={fieldErrors}
                        clearFieldError={clearFieldError}
                      />
                    )}
                    {currentStep === 1 && (
                      <EmploymentDetailsForm
                        formData={formData}
                        setFormData={setFormData}
                        jobId={jobId}
                        fieldErrors={fieldErrors}
                        clearFieldError={clearFieldError}
                      />
                    )}

                    {submitError && (
                      <div className="mt-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
                        <span className="text-rose-500 mt-0.5">
                          <ErrorIcon />
                        </span>
                        <p className="text-sm font-medium text-rose-800">
                          {submitError}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="bg-gray-50 px-6 py-4 border-t border-border-light flex items-center justify-between sticky bottom-0 z-10">
                    <button
                      onClick={handleGoBack}
                      className="text-sm font-medium text-text-secondary-light hover:text-text-primary-light transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <div className="flex items-center gap-3">
                      {currentStep > 0 && (
                        <button
                          onClick={handleBack}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-border-light rounded-xl text-sm font-medium text-text-primary-light hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <ArrowLeftIcon />
                          Back
                        </button>
                      )}

                      {currentStep < STEPS.length - 1 ? (
                        <button
                          onClick={handleNext}
                          className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold shadow-sm shadow-primary/20 transition-all cursor-pointer btn-primary-action"
                        >
                          Next Step
                          <ArrowRightIcon />
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold shadow-sm shadow-primary/20 transition-all cursor-pointer btn-primary-action disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <VerifiedIcon />
                          )}
                          {submitting
                            ? "Submitting…"
                            : isResubmit
                              ? "Update & Resubmit"
                              : "Finish & Create"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CandidateProfileCompletion;
