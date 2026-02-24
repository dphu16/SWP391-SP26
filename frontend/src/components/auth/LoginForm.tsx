import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, saveToken } from "../../services/authService";
import GoogleLoginButton from "./GoogleLoginButton";

/* ─── Icon: Eye (show password) ─────────────────────────────────────────── */
const EyeIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/* ─── Icon: Eye-off (hide password) ─────────────────────────────────────── */
const EyeOffIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ─── Icon: Loader spinner ───────────────────────────────────────────────── */
const SpinnerIcon: React.FC = () => (
  <svg
    className="w-5 h-5 animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

/* ─── Icon: Alert circle (validation) ───────────────────────────────────── */
const AlertIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/* ─── Input Field Component ──────────────────────────────────────────────── */
interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  rightSlot?: React.ReactNode;
  required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  disabled,
  autoComplete,
  rightSlot,
  required = false,
}) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={id}
      className="text-sm font-semibold text-[#164E63] select-none"
    >
      {label}
      {required && (
        <span className="text-[#EF4444] ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>

    <div className="relative">
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[
          "w-full px-4 py-3 pr-10",
          "border rounded-lg",
          "text-sm font-body text-[#164E63]",
          "placeholder:text-[#94a3b8]",
          "transition-all duration-200 ease-in-out",
          "outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#f8fafc]",
          error
            ? "border-[#EF4444] focus:border-[#EF4444] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
            : "border-[#e2e8f0] focus:border-[#0891B2] focus:shadow-[0_0_0_3px_rgba(8,145,178,0.13)]",
          "bg-white",
        ].join(" ")}
      />
      {rightSlot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
      )}
    </div>

    {error && (
      <p
        id={`${id}-error`}
        role="alert"
        className="flex items-start gap-1.5 text-xs text-[#EF4444] font-medium animate-fade-in"
      >
        <AlertIcon />
        {error}
      </p>
    )}
  </div>
);

/* ─── Divider Component ──────────────────────────────────────────────────── */
interface DividerProps {
  label?: string;
}

const Divider: React.FC<DividerProps> = ({ label = "Or" }) => (
  <div className="flex items-center gap-3 my-1">
    <div className="flex-1 h-px bg-[#e2e8f0]" aria-hidden="true" />
    <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest select-none">
      {label}
    </span>
    <div className="flex-1 h-px bg-[#e2e8f0]" aria-hidden="true" />
  </div>
);

const LoginForm: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  /* Field-level validation errors */
  const [errors, setErrors] = useState({ username: "", password: "" });
  /* Server / API error */
  const [apiError, setApiError] = useState("");

  /* ── Validate helper ─────────────────────────────────────────────────── */
  const validate = () => {
    const next = { username: "", password: "" };
    let valid = true;

    if (!username.trim()) {
      next.username = "Please enter your username.";
      valid = false;
    }

    if (!password) {
      next.password = "Please enter your password.";
      valid = false;
    } else if (password.length < 6) {
      next.password = "Password must be at least 6 characters.";
      valid = false;
    }

    setErrors(next);
    return valid;
  };

  /* ── Submit → call real API ──────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = await login({ username: username.trim(), password });
      saveToken(data.accessToken);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setTimeout(() => setIsGoogleLoading(false), 2000);
  };

  const isFormDisabled = isLoading || isGoogleLoading;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Form đăng nhập"
      className="flex flex-col gap-5"
    >
      {/* Email */}
      <InputField
        id="login-username"
        label="Username"
        type="text"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          if (errors.username) setErrors((prev) => ({ ...prev, username: "" }));
        }}
        placeholder="Enter your username"
        error={errors.username}
        disabled={isFormDisabled}
        autoComplete="username"
        required
      />

      {/* Password */}
      <InputField
        id="login-password"
        label="Password"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
        }}
        placeholder="Enter your password"
        error={errors.password}
        disabled={isFormDisabled}
        autoComplete="current-password"
        required
        rightSlot={
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            disabled={isFormDisabled}
            className={[
              "p-1 rounded-md",
              "text-[#64748b] hover:text-[#0891B2]",
              "transition-colors duration-150",
              "cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0891B2] focus-visible:ring-offset-1",
              "disabled:pointer-events-none",
            ].join(" ")}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        }
      />

      {/* API / Server Error Banner */}
      {apiError && (
        <div
          role="alert"
          className={[
            "flex items-start gap-2",
            "px-4 py-3 rounded-lg",
            "bg-[#FEF2F2] border border-[#FECACA]",
            "text-sm text-[#DC2626] font-medium",
            "animate-fade-in",
          ].join(" ")}
        >
          <AlertIcon />
          <span>{apiError}</span>
        </div>
      )}

      {/* Remember me + Forgot password */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="login-remember"
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <input
            id="login-remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isFormDisabled}
            className={[
              "w-4 h-4 rounded",
              "border-2 border-[#e2e8f0]",
              "text-[#22C55E]",
              "accent-[#22C55E]",
              "transition-colors duration-150",
              "cursor-pointer",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus-visible:ring-2 focus-visible:ring-[#0891B2] focus-visible:ring-offset-1",
            ].join(" ")}
          />
          <span className="text-sm text-[#164E63] group-hover:text-[#0891B2] transition-colors duration-150 font-medium">
            Remember me
          </span>
        </label>

        <a
          href="#"
          className={[
            "text-sm font-semibold text-[#0891B2]",
            "hover:text-[#22D3EE]",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:underline",
            "underline-offset-2",
          ].join(" ")}
          aria-label="Forgot password?"
        >
          Forgot password?
        </a>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isFormDisabled}
        aria-label="Login"
        className={[
          "w-full flex items-center justify-center gap-2",
          "px-6 py-3 rounded-lg",
          "bg-[#22C55E] hover:bg-[#16a34a]",
          "text-white font-semibold text-sm",
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
            <span>Logging in...</span>
          </>
        ) : (
          <span>Login</span>
        )}
      </button>

      {/* Divider */}
      <Divider />

      {/* Google Login */}
      <GoogleLoginButton
        isLoading={isGoogleLoading}
        disabled={isFormDisabled}
        onClick={handleGoogleLogin}
      />
    </form>
  );
};

export default LoginForm;
