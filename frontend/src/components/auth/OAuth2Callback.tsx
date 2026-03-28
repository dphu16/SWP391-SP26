import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveToken } from "../../services/authService";
import { decodeJwt } from "../../utils/jwtDecode";

const OAuth2Callback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token") ?? searchParams.get("accessToken");

    if (!token) {
      setError("Không nhận được token từ server. Vui lòng thử lại.");
      setTimeout(() => navigate("/login", { replace: true }), 3000);
      return;
    }

    // Validate the token before saving
    const payload = decodeJwt(token);
    if (!payload) {
      setError("Token không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.");
      setTimeout(() => navigate("/login", { replace: true }), 3000);
      return;
    }

    // Save token and redirect to dashboard
    saveToken(token);
    navigate("/dashboard", { replace: true });
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECFEFF] px-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#e2e8f0] text-center max-w-md w-full">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#FEF2F2] flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DC2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#164E63] mb-2">
            Đăng nhập thất bại
          </h2>
          <p className="text-sm text-[#64748b] mb-4">{error}</p>
          <p className="text-xs text-[#94a3b8]">
            Đang chuyển về trang đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  // Loading state while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ECFEFF] px-4">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#e2e8f0] text-center max-w-md w-full">
        <svg
          className="w-10 h-10 animate-spin text-[#0891B2] mx-auto mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
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
        <h2 className="text-lg font-bold text-[#164E63] mb-1">
          Đang xử lý đăng nhập...
        </h2>
        <p className="text-sm text-[#64748b]">Vui lòng chờ trong giây lát.</p>
      </div>
    </div>
  );
};

export default OAuth2Callback;
