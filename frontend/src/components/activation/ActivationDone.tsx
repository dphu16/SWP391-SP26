import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CenteredCard } from "./shared";
import { removeToken, getToken } from "../../services/authService";

const ActivationDone: React.FC = () => {
  const navigate = useNavigate();

  // If another account is currently logged in, log it out automatically
  // so the new employee can log in fresh with their activated credentials.
  useEffect(() => {
    if (getToken()) {
      removeToken();
    }
  }, []);

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
        <h2 className="text-xl font-bold text-gray-900">Account Activated!</h2>
        <p className="text-gray-600 text-sm">
          Your account has been set up successfully. You can now log in with
          your email and password.
        </p>
        {getToken() === null && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Previous session has been logged out. Please sign in with your new account.
          </p>
        )}
        <button
          onClick={() => navigate("/login")}
          className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Go to Login
        </button>
      </div>
    </CenteredCard>
  );
};

export default ActivationDone;
