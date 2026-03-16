import React from "react";
import { useNavigate } from "react-router-dom";
import { useLoginForm } from "./hooks/useLoginForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { EyeIcon, EyeOffIcon, SpinnerIcon, AlertIcon } from "./icons";
import { InputField, Divider } from "./shared";

library.add(fab);

const LoginForm: React.FC = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    showPassword,
    setShowPassword,
    isLoading,
    isGoogleLoading,
    errors,
    setErrors,
    apiError,
    isFormDisabled,
    handleSubmit,
    handleGoogleLogin,
  } = useLoginForm();
  const navigate = useNavigate();

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Form đăng nhập"
      className="flex flex-col gap-4"
    >
      {/* Email */}
      <InputField
        id="login-email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
        }}
        placeholder="Enter your email"
        error={errors.email}
        disabled={isFormDisabled}
        autoComplete="email"
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
              "p-0.5 rounded-md",
              "text-gray-400 hover:text-[#0891B2]",
              "transition-colors duration-150",
              "cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0891B2]",
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
            "flex items-start gap-1.5",
            "px-3 py-2 rounded-lg",
            "bg-red-50 border border-red-100",
            "text-[12px] text-red-600 font-medium",
            "animate-fade-in",
          ].join(" ")}
        >
          <AlertIcon />
          <span>{apiError}</span>
        </div>
      )}

      {/* Remember me + Forgot password */}
      <div className="flex items-center justify-between pb-1">
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
              "w-3.5 h-3.5 rounded-sm",
              "border border-gray-300",
              "text-[#22C55E]",
              "accent-[#22C55E]",
              "transition-colors duration-150",
              "cursor-pointer",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus-visible:ring-2 focus-visible:ring-[#0891B2] focus-visible:ring-offset-1",
            ].join(" ")}
          />
          <span className="text-[13px] text-gray-500 group-hover:text-[#164E63] transition-colors duration-150 font-medium">
            Remember me
          </span>
        </label>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            navigate("/forgot-password");
          }}
          className={[
            "text-[13px] font-medium text-[#0891B2]",
            "hover:text-[#164E63]",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:underline",
          ].join(" ")}
          aria-label="Forgot password?"
        >
          Forgot password?
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isFormDisabled}
        aria-label="Login"
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
            <span>Logging in...</span>
          </>
        ) : (
          <span>Login</span>
        )}
      </button>

      {/* Divider */}
      <Divider />

      {/* Google Login */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isFormDisabled}
        aria-label="Đăng nhập với Google"
        className={[
          "w-full flex items-center justify-center gap-2",
          "px-4 py-2.5 rounded-lg",
          "border border-gray-200",
          "bg-white text-[#164E63]",
          "font-medium text-sm",
          "transition-all duration-200 ease-in-out",
          "cursor-pointer",
          "hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:ring-offset-1",
          "active:scale-[0.98] active:bg-gray-100",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:shadow-none",
        ].join(" ")}
      >
        {isGoogleLoading ? (
          <SpinnerIcon />
        ) : (
          <FontAwesomeIcon icon={["fab", "google"]} className="w-[18px] h-[18px] text-black" />
        )}
        <span>{isGoogleLoading ? "Processing..." : "Login with Google"}</span>
      </button>
    </form>
  );
};

export default LoginForm;
