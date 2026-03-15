import React from "react";
import { Navigate } from "react-router-dom";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";
import { getToken } from "../../services/authService";
import { decodeJwt } from "../../utils/jwtDecode";

const BackgroundDecor: React.FC = () => (
  <div
    className="absolute inset-0 overflow-hidden pointer-events-none"
    aria-hidden="true"
  >
    <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#0891B2] opacity-[0.06]" />
    <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-[#22C55E] opacity-[0.05]" />
    <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-[#22D3EE] opacity-[0.06] blur-2xl" />
  </div>
);

const ResetPasswordPage: React.FC = () => {
  const token = getToken();
  const payload = decodeJwt(token);
  if (token && payload) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-[#f8fafc] font-body">
      <BackgroundDecor />

      <div className="relative z-10 w-full max-w-sm px-4" role="main">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 animate-scale-in">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-heading font-bold text-[#164E63] tracking-tight leading-tight">
              Set New Password
            </h1>
            <p className="mt-1 text-sm font-body text-gray-500">
              Choose a strong password for your account.
            </p>
          </div>

          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
