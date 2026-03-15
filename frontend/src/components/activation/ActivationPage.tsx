import React from "react";
import { useActivation } from "./hooks/useActivation";
import { STEPS } from "./constants";
import { CenteredCard, ErrorBanner, Spinner } from "./shared";
import StepIndicator from "./StepIndicator";
import ActivationDone from "./ActivationDone";
import PasswordForm from "./forms/PasswordForm";
import EmergencyContactForm from "./forms/EmergencyContactForm";
import BankAccountForm from "./forms/BankAccountForm";

const ActivationPage: React.FC = () => {
  const activationProps = useActivation();
  const {
    token,
    step,
    error,
    info,
    loading,
    done,
    errors,
    handleSetPassword,
    handleEmergencyContact,
    handleBankAccount,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    contactName,
    setContactName,
    relationship,
    setRelationship,
    contactPhone,
    setContactPhone,
    contactAddress,
    setContactAddress,
    accountNumber,
    setAccountNumber,
    bankName,
    setBankName,
    branchName,
    setBranchName,
    accountHolderName,
    setAccountHolderName,
  } = activationProps;

  // ── Error / no-token state ──
  if (!token && !loading) {
    return (
      <CenteredCard>
        <ErrorBanner message="No activation token provided. Please use the link from your email." />
      </CenteredCard>
    );
  }

  // ── Done state ──
  if (done) {
    return <ActivationDone />;
  }

  return (
    <div className="min-h-screen bg-[#ECFEFF] flex items-center justify-center p-4 sm:p-8 selection:bg-[#22D3EE] selection:text-white transition-colors duration-300">
      <div className="w-full max-w-xl flex flex-col mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#164E63] tracking-tight">
            Account Activation
          </h1>
          {info && (
            <p className="text-[#0891B2] text-base mt-2 transition-opacity">
              Welcome,{" "}
              <span className="font-bold text-[#164E63]">
                {info.employeeName}
              </span>
            </p>
          )}
        </div>

        {/* Step indicator */}
        <div className="w-full px-2 mb-8">
          <StepIndicator currentStep={step} />
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-cyan-100/50 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">
            {/* Step title */}
            {step > 0 && (
              <div className="pb-4 border-b border-cyan-50">
                <h2 className="text-xl font-bold text-[#164E63]">
                  {STEPS[step]?.title}
                </h2>
                <p className="text-sm font-medium text-[#0891B2] mt-1.5">
                  {STEPS[step]?.description}
                </p>
              </div>
            )}

            {/* Loading / verifying */}
            {step === 0 && loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Spinner />
                <span className="text-sm font-medium text-[#0891B2] animate-pulse">
                  Verifying your secure link…
                </span>
              </div>
            )}

            {/* Step 0 error */}
            {step === 0 && error && <ErrorBanner message={error} />}

            {/* ── Step 1: Password ── */}
            {step === 1 && (
              <PasswordForm
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                errors={errors}
              />
            )}

            {/* ── Step 2: Emergency Contact ── */}
            {step === 2 && (
              <EmergencyContactForm
                contactName={contactName}
                setContactName={setContactName}
                relationship={relationship}
                setRelationship={setRelationship}
                contactPhone={contactPhone}
                setContactPhone={setContactPhone}
                contactAddress={contactAddress}
                setContactAddress={setContactAddress}
                errors={errors}
              />
            )}

            {/* ── Step 3: Bank Account ── */}
            {step === 3 && (
              <BankAccountForm
                accountNumber={accountNumber}
                setAccountNumber={setAccountNumber}
                bankName={bankName}
                setBankName={setBankName}
                branchName={branchName}
                setBranchName={setBranchName}
                accountHolderName={accountHolderName}
                setAccountHolderName={setAccountHolderName}
                errors={errors}
              />
            )}

            {/* Error banner */}
            {step > 0 && error && <ErrorBanner message={error} />}
          </div>

          {/* Footer with action button */}
          {step > 0 && (
            <div className="bg-cyan-50/30 px-6 sm:px-8 py-5 border-t border-cyan-50 flex items-center justify-end">
              <button
                onClick={
                  step === 1
                    ? handleSetPassword
                    : step === 2
                      ? handleEmergencyContact
                      : handleBankAccount
                }
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#22C55E] hover:opacity-90 text-white rounded-lg text-base font-semibold transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-px shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-[#22C55E]/50 focus:ring-offset-2"
              >
                {loading && <Spinner />}
                {step === 3 ? "Finish & Activate" : "Continue"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivationPage;