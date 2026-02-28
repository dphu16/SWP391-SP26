import React from "react";
import { Navigate } from "react-router-dom";
import LoginForm from "./LoginForm";
import { getToken } from "../../services/authService";
import { decodeJwt } from "../../utils/jwtDecode";

const BackgroundDecor: React.FC = () => (
 <div
 className="absolute inset-0 overflow-hidden pointer-events-none"
 aria-hidden="true"
 >
 <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#0891B2] opacity-[0.07]" />
 <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-[#22C55E] opacity-[0.07]" />
 <div className="absolute top-1/3 right-10 w-24 h-24 rounded-full bg-[#22D3EE] opacity-[0.06]" />
 </div>
);

const LoginPage: React.FC = () => {
 // If user is already authenticated, redirect to dashboard
 const token = getToken();
 const payload = decodeJwt(token);
 if (token && payload) {
 return <Navigate to="/dashboard" replace />;
 }

 return (
 <div
 className={[
 "relative min-h-screen w-full",
 "flex items-center justify-center",
 "bg-[#ECFEFF]",
 "px-4 py-8",
 "font-body",
 ].join(" ")}
 >
 <BackgroundDecor />

 {/* Login Card */}
 <div
 className={[
 "relative z-10",
 "w-full max-w-md",
 "bg-white",
 "rounded-2xl",
 "p-8 sm:p-10",
 "shadow-[0_20px_25px_rgba(0,0,0,0.10),_0_4px_6px_rgba(0,0,0,0.06)]",
 "border border-[#e2e8f0]",
 "animate-scale-in",
 ].join(" ")}
 role="main"
 >
 {/* ── Heading ───────────────────────────────────────────────────── */}
 <div className="mb-7 text-center">
 <h1 className="text-2xl font-heading font-bold text-[#164E63] tracking-tight leading-tight">
 LOGIN
 </h1>
 <p className="mt-1.5 text-sm font-body text-[#64748b]">
 Welcome back! Please login to continue.
 </p>
 </div>

 {/* ── Form ──────────────────────────────────────────────────────── */}
 <LoginForm />
 </div>
 </div>
 );
};

export default LoginPage;
