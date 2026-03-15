import React, { useState } from "react";
import { Link } from "react-router-dom";
import { InputField } from "./shared";
import { SpinnerIcon, AlertIcon } from "./icons";

const MailSentIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-12 h-12 text-[#22C55E]"
    aria-hidden="true"
  >
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.66A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
    <polyline points="9 11 12 14 22 4" />
  </svg>
);

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = (): boolean => {
    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Something went wrong. Please try again.");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <MailSentIcon />
        </div>
        <h2 className="text-xl font-heading font-bold text-[#164E63]">Check your inbox</h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
          If <span className="font-semibold text-[#164E63]">{email}</span> is registered in our
          system, you'll receive a password reset link shortly.
        </p>
        <p className="text-xs text-gray-400">The link will expire in 30 minutes.</p>
        <Link
          to="/login"
          className="mt-2 text-sm font-medium text-[#0891B2] hover:text-[#164E63] transition-colors duration-150"
        >
          ← Back to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Forgot password form" className="flex flex-col gap-4">
      <InputField
        id="forgot-email"
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (emailError) setEmailError("");
          if (apiError) setApiError("");
        }}
        placeholder="Enter your work email"
        error={emailError}
        disabled={isLoading}
        autoComplete="email"
        required
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
        aria-label="Send reset link"
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
            <span>Sending link...</span>
          </>
        ) : (
          <span>Send Reset Link</span>
        )}
      </button>

      <Link
        to="/login"
        className="text-center text-[13px] font-medium text-[#0891B2] hover:text-[#164E63] transition-colors duration-150 focus-visible:outline-none focus-visible:underline"
      >
        ← Back to Login
      </Link>
    </form>
  );
};

export default ForgotPasswordForm;
