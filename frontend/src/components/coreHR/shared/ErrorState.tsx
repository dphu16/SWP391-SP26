import React from "react";

interface ErrorStateProps {
  message: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  description = "Check your backend connection and try again.",
  onRetry,
  retryLabel = "Retry",
}) => (
  <div className="rounded-2xl border border-rose-200 bg-surface-light p-16 flex flex-col items-center gap-4 text-center animate-fade-in">
    <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-6 h-6 text-rose-500"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    </div>
    <div>
      <p className="font-semibold text-text-primary-light">{message}</p>
      <p className="text-sm text-text-secondary-light mt-1">{description}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer btn-primary-action"
      >
        {retryLabel}
      </button>
    )}
  </div>
);

export default ErrorState;
