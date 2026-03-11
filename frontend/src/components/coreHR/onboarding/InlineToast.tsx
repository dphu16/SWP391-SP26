import React, { useEffect } from "react";
import { VerifiedIcon, ErrorIcon, XIcon } from "./formConstants";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const InlineToast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-lg border animate-slide-in-right max-w-sm ${
        type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-rose-50 border-rose-200 text-rose-800"
      }`}
    >
      <span
        className={`flex-shrink-0 ${
          type === "success" ? "text-emerald-500" : "text-rose-500"
        }`}
      >
        {type === "success" ? <VerifiedIcon /> : <ErrorIcon />}
      </span>
      <p className="text-sm font-semibold flex-1">{message}</p>
      <button
        onClick={onClose}
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="Dismiss"
      >
        <XIcon />
      </button>
    </div>
  );
};

export default InlineToast;
