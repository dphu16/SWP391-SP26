import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  verifyToken,
  setPassword,
  submitEmergencyContact,
  submitBankAccount,
  type ActivationResponse,
} from "../../services/activationService";

// ── Step definitions ──
const STEPS = [
  {
    id: 0,
    title: "Verify Token",
    description: "Validating your activation link",
  },
  { id: 1, title: "Set Password", description: "Create your login password" },
  {
    id: 2,
    title: "Emergency Contact",
    description: "Provide emergency contact info",
  },
  { id: 3, title: "Bank Account", description: "Add your bank details" },
] as const;

// Map backend currentStep strings to step index
function resolveStep(currentStep: string | undefined): number {
  switch (currentStep) {
    case "PASSWORD_CREATED":
      return 2;
    case "COMPLETED":
      return 3;
    default:
      return 1; // PENDING_ACTIVATION or any other → start at password step
  }
}

// ── Icon helpers ──
const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path
      fillRule="evenodd"
      d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
      clipRule="evenodd"
    />
  </svg>
);

const Spinner = () => (
  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

// ── Main Component ──
const ActivationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  // Global state
  const [step, setStep] = useState(0); // 0 = verifying token
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<ActivationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Emergency Contact
  const [contactName, setContactName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");

  // Step 3: Bank Account
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  // Step 4: Done
  const [done, setDone] = useState(false);

  // ── Step 0: Verify token on mount ──
  useEffect(() => {
    if (!token) {
      setError("No activation token found in the URL.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    verifyToken(token)
      .then((res) => {
        if (cancelled) return;
        setInfo(res);
        setStep(resolveStep(res.currentStep));
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Invalid or expired activation link.";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // ── Step 1: Set password ──
  const handleSetPassword = async () => {
    setError(null);
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await setPassword({ activationToken: token, newPassword });
      setInfo(res);
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to set password.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Emergency contact ──
  const handleEmergencyContact = async () => {
    setError(null);
    if (!contactName.trim() || !relationship.trim() || !contactPhone.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await submitEmergencyContact(token, {
        contactName,
        relationship,
        phone: contactPhone,
        address: contactAddress || undefined,
      });
      setInfo(res);
      setStep(3);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to save emergency contact.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Bank account ──
  const handleBankAccount = async () => {
    setError(null);
    if (!accountNumber.trim() || !bankName.trim()) {
      setError("Account number and bank name are required.");
      return;
    }
    setLoading(true);
    try {
      await submitBankAccount(token, {
        accountNumber,
        bankName,
        branchName: branchName || undefined,
        accountHolderName: accountHolderName || undefined,
      });
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save bank account.");
    } finally {
      setLoading(false);
    }
  };

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
    return (
      <CenteredCard>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Account Activated!
          </h2>
          <p className="text-gray-600 text-sm">
            Your account has been set up successfully. You can now log in with
            your email and password.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Go to Login
          </button>
        </div>
      </CenteredCard>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Account Activation
          </h1>
          {info && (
            <p className="text-gray-500 text-sm mt-1">
              Welcome,{" "}
              <span className="font-medium text-gray-700">
                {info.employeeName}
              </span>
            </p>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.slice(1).map((s) => {
            const isCompleted = step > s.id;
            const isActive = step === s.id;
            return (
              <React.Fragment key={s.id}>
                {s.id > 1 && (
                  <div
                    className={`h-0.5 w-8 rounded-full transition-colors ${
                      step >= s.id ? "bg-blue-500" : "bg-gray-200"
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

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 space-y-5">
            {/* Step title */}
            {step > 0 && (
              <div className="pb-3 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  {STEPS[step]?.title}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {STEPS[step]?.description}
                </p>
              </div>
            )}

            {/* Loading / verifying */}
            {step === 0 && loading && (
              <div className="flex items-center justify-center py-12 gap-3">
                <Spinner />
                <span className="text-sm text-gray-500">
                  Verifying your activation link…
                </span>
              </div>
            )}

            {/* Step 0 error */}
            {step === 0 && error && <ErrorBanner message={error} />}

            {/* ── Step 1: Password ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* ── Step 2: Emergency Contact ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      placeholder="e.g. Spouse, Parent"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g. 0912345678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Bank Account ── */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 0123456789"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Vietcombank"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error banner */}
            {step > 0 && error && <ErrorBanner message={error} />}
          </div>

          {/* Footer with action button */}
          {step > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={
                  step === 1
                    ? handleSetPassword
                    : step === 2
                      ? handleEmergencyContact
                      : handleBankAccount
                }
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Spinner />}
                {step === 3 ? "Finish & Activate" : "Continue"}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          HRM System — Human Resource Management
        </p>
      </div>
    </div>
  );
};

// ── Utility Components ──

const CenteredCard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      {children}
    </div>
  </div>
);

const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5 shrink-0 mt-0.5"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
    <span>{message}</span>
  </div>
);

export default ActivationPage;
