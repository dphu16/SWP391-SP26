import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { 
  login, 
  saveToken, 
  saveRefreshToken, 
  getRefreshToken, 
  refreshAccessToken, 
  getToken,
  removeToken 
} from "../../../services/authService";

export const useLoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  /* Field-level validation errors */
  const [errors, setErrors] = useState({ email: "", password: "" });
  /* Server / API error */
  const [apiError, setApiError] = useState("");

  const [searchParams] = useSearchParams();
  const urlError = searchParams.get("error");

  /* Auto-login with refresh token if exists */
  useEffect(() => {
    const rfToken = getRefreshToken();
    if (rfToken && !getToken()) {
      handleAutoLogin(rfToken);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAutoLogin = async (rfToken: string) => {
    setIsLoading(true);
    try {
      const data = await refreshAccessToken(rfToken);
      saveToken(data.accessToken);
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Auto login failed", err);
      removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (urlError === "account_inactive") {
      setApiError("Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
    }
  }, [urlError]);

  /* ── Validate helper ─────────────────────────────────────────────────── */
  const validate = () => {
    const next = { email: "", password: "" };
    let valid = true;

    if (!email.trim()) {
      next.email = "Please enter your email.";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Please enter a valid email address.";
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
      const data = await login({ email: email.trim(), password });
      saveToken(data.accessToken);
      if (data.refreshToken) {
        saveRefreshToken(data.refreshToken, rememberMe);
      }
      navigate(from, { replace: true });
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
    window.location.href = "http://localhost:8080/oauth2/authorize/google";
  };

  const isFormDisabled = isLoading || isGoogleLoading;

  return {
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
  };
};
