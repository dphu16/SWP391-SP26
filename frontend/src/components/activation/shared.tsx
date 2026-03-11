import React from "react";

export const Spinner = () => (
  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

export const CenteredCard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      {children}
    </div>
  </div>
);

export const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
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
