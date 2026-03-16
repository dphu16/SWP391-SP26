import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { InputField } from "./shared";
import { EyeIcon, EyeOffIcon, SpinnerIcon, AlertIcon } from "./icons";

const ResetPasswordForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({ newPassword: "", confirmPassword: "" });
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // If there's no token in the URL, redirect away immediately
  useEffect(() => {
    if (!token) {
      navigate("/forgot-password", { replace: true });
    }
  }, [token, navigate]);

  const validate = (): boolean => {
    const newErrors = { newPassword: "", confirmPassword: "" };
    let valid = true;

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
      valid = false;
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
      valid = false;
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to reset password. The link may have expired.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10 text-[#22C55E]"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className="text-xl font-heading font-bold text-[#164E63]">Password Reset!</h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
          Your password has been successfully changed. You can now log in with your new password.
          A confirmation email has been sent to you.
        </p>
        <Link
          to="/login"
          className="mt-2 inline-flex items-center justify-center px-5 py-2 rounded-lg bg-[#22C55E] hover:bg-[#16a34a] text-white font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const toggleBtn = (
    show: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => (
    <button
      type="button"
      aria-label={show ? "Hide password" : "Show password"}
      onClick={() => setter((v) => !v)}
      disabled={isLoading}
      className={[
        "p-0.5 rounded-md",
        "text-gray-400 hover:text-[#0891B2]",
        "transition-colors duration-150",
        "cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0891B2]",
        "disabled:pointer-events-none",
      ].join(" ")}
    >
      {show ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Reset password form" className="flex flex-col gap-4">
      <InputField
        id="reset-new-password"
        label="New Password"
        type={showNew ? "text" : "password"}
        value={newPassword}
        onChange={(e) => {
          setNewPassword(e.target.value);
          if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: "" }));
        }}
        placeholder="At least 8 characters"
        error={errors.newPassword}
        disabled={isLoading}
        autoComplete="new-password"
        required
        rightSlot={toggleBtn(showNew, setShowNew)}
      />

      <InputField
        id="reset-confirm-password"
        label="Confirm New Password"
        type={showConfirm ? "text" : "password"}
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "" }));
        }}
        placeholder="Re-enter your new password"
        error={errors.confirmPassword}
        disabled={isLoading}
        autoComplete="new-password"
        required
        rightSlot={toggleBtn(showConfirm, setShowConfirm)}
      />

      {apiError && (
        <div
          role="alert"
          className="flex items-start gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-[12px] text-red-600 font-medium animate-fade-in"
        >
          <AlertIcon />
          <span>{apiError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        aria-label="Reset password"
        className={[
          "w-full flex items-center justify-center gap-2",
          "px-4 py-2.5 rounded-lg",
          "bg-[#22C55E] hover:bg-[#16a34a]",
          "text-white font-medium text-sm",
          "transition-all duration-200 ease-in-out",
          "cursor-pointer",
          "shadow-sm hover:shadow-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] focus-visible:ring-offset-2",
          "active:scale-[0.98]",
          "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#22C55E] disabled:hover:shadow-sm disabled:active:scale-100",
        ].join(" ")}
      >
        {isLoading ? (
          <>
            <SpinnerIcon />
            <span>Resetting...</span>
          </>
        ) : (
          <span>Set New Password</span>
        )}
      </button>

      <Link
        to="/forgot-password"
        className="text-center text-[13px] font-medium text-[#0891B2] hover:text-[#164E63] transition-colors duration-150 focus-visible:outline-none focus-visible:underline"
      >
        ← Request a new link
      </Link>
    </form>
  );
};

export default ResetPasswordForm;
