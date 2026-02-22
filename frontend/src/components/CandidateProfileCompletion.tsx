import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../services/apiClient";
import type { CreateNewHireDTO } from "../types";

const API_URL = "/api/employees/new";

// ============================
// Types
// ============================
interface NewHireCredentials {
  username: string;
  rawPassword: string;
  fullName: string;
}

// ============================
// SVG Icons (Heroicons style — MASTER.md: no emoji/Material Icons)
// ============================
const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
    <path
      fillRule="evenodd"
      d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
      clipRule="evenodd"
    />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" />
    <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path
      fillRule="evenodd"
      d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.589 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.563 2 12.162 2 7c0-.538.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.749zm4.196 5.954a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
      clipRule="evenodd"
    />
  </svg>
);

const WarningIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path
      fillRule="evenodd"
      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
      clipRule="evenodd"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path
      fillRule="evenodd"
      d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06l2.97-2.97H3.75a.75.75 0 010-1.5h7.44L8.22 4.03a.75.75 0 010-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path
      fillRule="evenodd"
      d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path
      fillRule="evenodd"
      d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const PersonIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark flex-shrink-0"
  >
    <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2-3a2 2 0 11-4 0 2 2 0 014 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.029 10 8 10c-2.029 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
  </svg>
);

const KeyIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark flex-shrink-0"
  >
    <path
      fillRule="evenodd"
      d="M6.5 0a6.5 6.5 0 105.478 9.984l.544.544a1.5 1.5 0 001.06.44h.418a1.5 1.5 0 001.5-1.5v-.418a1.5 1.5 0 00-.44-1.06l-.544-.544A6.5 6.5 0 006.5 0zm-5 6.5a5 5 0 1110 0 5 5 0 01-10 0zm4.5 0a.5.5 0 11-1 0 .5.5 0 011 0z"
      clipRule="evenodd"
    />
  </svg>
);

const ChecklistIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M2.5 3.5a.5.5 0 000 1h11a.5.5 0 000-1h-11zm0 4a.5.5 0 000 1h11a.5.5 0 000-1h-11zm0 4a.5.5 0 000 1h11a.5.5 0 000-1h-11z" />
    <path
      fillRule="evenodd"
      d="M1.5 3.5A1.5 1.5 0 013 2h10a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0113 14H3a1.5 1.5 0 01-1.5-1.5v-9zm1.5 0v9a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-9a.5.5 0 00-.5-.5H3a.5.5 0 00-.5.5z"
      clipRule="evenodd"
    />
  </svg>
);

const SaveIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M2.75 14A1.75 1.75 0 011 12.25v-8.5C1 2.784 1.784 2 2.75 2h8.5c.464 0 .909.184 1.237.513l1.5 1.5c.329.328.513.773.513 1.237v7a1.75 1.75 0 01-1.75 1.75h-10zM2.5 12.25c0 .138.112.25.25.25h10a.25.25 0 00.25-.25v-7a.25.25 0 00-.073-.177l-1.5-1.5a.25.25 0 00-.177-.073H2.75a.25.25 0 00-.25.25v8.5zM5 4.75A.75.75 0 015.75 4h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 015 4.75zM5 8a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 015 8zm0 3.25a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" />
  </svg>
);

const VerifiedIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path
      fillRule="evenodd"
      d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
      clipRule="evenodd"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    className="w-4 h-4 flex-shrink-0"
  >
    <path
      fillRule="evenodd"
      d="M8 15A7 7 0 108 1a7 7 0 000 14zm0-11a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 018 4zm0 9a1 1 0 100-2 1 1 0 000 2z"
      clipRule="evenodd"
    />
  </svg>
);

const inputCls =
  "w-full px-4 py-2.5 text-sm rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 text-text-primary-light dark:text-text-primary-dark placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

const labelCls =
  "block text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-1.5";

// ============================
// Toast Notification
// ============================
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-lg border animate-slide-in-right max-w-sm ${
        type === "success"
          ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200"
          : "bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-200"
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

// ============================
// Credentials Modal
// ============================
interface CredentialsModalProps {
  credentials: NewHireCredentials;
  onClose: () => void;
}

const CredentialsModal: React.FC<CredentialsModalProps> = ({
  credentials,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [usernameCopied, setUsernameCopied] = useState(false);

  const copyToClipboard = async (text: string, onDone: () => void) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    onDone();
  };

  const handleCopyPassword = () =>
    copyToClipboard(credentials.rawPassword, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });

  const handleCopyUsername = () =>
    copyToClipboard(credentials.username, () => {
      setUsernameCopied(true);
      setTimeout(() => setUsernameCopied(false), 2500);
    });

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      {/* Backdrop — MASTER.md: backdrop-filter blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — MASTER.md: rounded-2xl, max-w-500px, padding 32px */}
      <div className="relative w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-2xl shadow-lg border border-border-light dark:border-border-dark overflow-hidden animate-scale-in">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-primary to-emerald-500 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white">
              <ShieldCheckIcon />
            </span>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Employee Created!
            </h2>
            <p className="text-emerald-100 text-xs mt-0.5">
              {credentials.fullName} has been successfully onboarded.
            </p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="mx-6 mt-5 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
          <span className="text-amber-500 flex-shrink-0 mt-0.5">
            <WarningIcon />
          </span>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200 leading-relaxed">
            <strong>Important:</strong> Please copy these credentials now. The
            password will <strong>not</strong> be shown again.
          </p>
        </div>

        {/* Credentials */}
        <div className="px-6 py-5 space-y-4">
          {/* Username */}
          <div>
            <label className={labelCls}>Username</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-xl px-4 py-3">
                <PersonIcon />
                <span className="font-mono text-sm font-semibold text-text-primary-light dark:text-text-primary-dark flex-1 select-all">
                  {credentials.username}
                </span>
              </div>
              <button
                onClick={handleCopyUsername}
                title="Copy username"
                className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  usernameCopied
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-600 text-emerald-600"
                    : "bg-white dark:bg-gray-800 border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:border-primary hover:text-primary"
                }`}
              >
                {usernameCopied ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className={labelCls}>Temporary Password</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-xl px-4 py-3">
                <KeyIcon />
                <span className="font-mono text-sm font-semibold text-text-primary-light dark:text-text-primary-dark flex-1 select-all tracking-wider">
                  {credentials.rawPassword}
                </span>
              </div>
              <button
                onClick={handleCopyPassword}
                title="Copy password"
                className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-600 text-emerald-600"
                    : "bg-white dark:bg-gray-800 border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:border-primary hover:text-primary"
                }`}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1 animate-fade-in">
                <CheckIcon />
                Password copied to clipboard!
              </p>
            )}
          </div>
        </div>

        {/* Footer — MASTER.md: btn-primary */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer btn-primary-action"
          >
            <ArrowRightIcon />
            Done — Go to Onboarding
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================
// Steps definition
// ============================
const steps = [
  {
    id: 0,
    title: "Personal Information",
    description: "Basic personal details",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2-3a2 2 0 11-4 0 2 2 0 014 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4z" />
      </svg>
    ),
  },
  {
    id: 1,
    title: "Employment Details",
    description: "Department and position",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
        <path
          fillRule="evenodd"
          d="M1 2.5A1.5 1.5 0 012.5 1h8A1.5 1.5 0 0112 2.5v3.563a3.5 3.5 0 00-1.5-.063V2.5h-8v11h4.5v-1.5a1.5 1.5 0 011.5-1.5h2a1.5 1.5 0 011.5 1.5v1.5h.5a.5.5 0 010 1H2.5A1.5 1.5 0 011 13.5v-11z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 2,
    title: "Citizen ID",
    description: "Required for background check",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
        <path
          fillRule="evenodd"
          d="M2.5 3A1.5 1.5 0 001 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0115 5.293V4.5A1.5 1.5 0 0013.5 3h-11z"
          clipRule="evenodd"
        />
        <path d="M15 6.954L8.978 9.86a2.25 2.25 0 01-1.956 0L1 6.954V11.5A1.5 1.5 0 002.5 13h11a1.5 1.5 0 001.5-1.5V6.954z" />
      </svg>
    ),
  },
  {
    id: 3,
    title: "Tax Code",
    description: "For tax regulation compliance",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z" />
      </svg>
    ),
  },
  {
    id: 4,
    title: "Home Address",
    description: "Proof of residence",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M8.354 1.146a.5.5 0 00-.708 0l-6 6A.5.5 0 002 7.5v7a.5.5 0 00.5.5h4a.5.5 0 00.5-.5v-4h2v4a.5.5 0 00.5.5h4a.5.5 0 00.5-.5v-7a.5.5 0 00-.146-.354L13 5.793V2.5a.5.5 0 00-.5-.5h-1a.5.5 0 00-.5.5v1.293L8.354 1.146z" />
      </svg>
    ),
  },
];

// ============================
// Step 0: Personal Information
// ============================
interface PersonalInfoFormProps {
  formData: CreateNewHireDTO;
  setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>>;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  formData,
  setFormData,
}) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
        Personal Information
      </h1>
      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
        Please ensure all personal details are accurate and up to date.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <label className={labelCls}>
          Full Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) =>
            setFormData({ ...formData, fullName: e.target.value })
          }
          placeholder="e.g. Nguyen Van A"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>
          Email Address <span className="text-rose-500">*</span>
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="e.g. name@company.com"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Phone Number</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="e.g. 0901234567"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Date of Birth</label>
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) =>
            setFormData({ ...formData, dateOfBirth: e.target.value })
          }
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Gender</label>
        <select
          value={formData.gender}
          onChange={(e) =>
            setFormData({
              ...formData,
              gender: e.target.value as CreateNewHireDTO["gender"],
            })
          }
          className={inputCls}
        >
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
    </div>
  </div>
);

// ============================
// Step 1: Employment Details
// ============================
interface EmploymentDetailsFormProps {
  formData: CreateNewHireDTO;
  setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>>;
}

const EmploymentDetailsForm: React.FC<EmploymentDetailsFormProps> = ({
  formData,
  setFormData,
}) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
        Employment Details
      </h1>
      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
        Assign department and position for the new employee.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <label className={labelCls}>
          Department ID <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={formData.departmentId}
          onChange={(e) =>
            setFormData({ ...formData, departmentId: e.target.value })
          }
          placeholder="Department UUID"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>
          Position ID <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={formData.positionId}
          onChange={(e) =>
            setFormData({ ...formData, positionId: e.target.value })
          }
          placeholder="Position UUID"
          className={inputCls}
        />
      </div>
    </div>
  </div>
);

// ============================
// Step 2: Citizen ID
// ============================
interface CitizenIdFormProps {
  formData: CreateNewHireDTO;
  setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>>;
}

const CitizenIdForm: React.FC<CitizenIdFormProps> = ({
  formData,
  setFormData,
}) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
        Upload Citizen ID
      </h1>
      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
        Provide the candidate's government-issued ID number.
      </p>
    </div>

    <div>
      <label className={labelCls}>Citizen ID Number</label>
      <input
        type="text"
        value={formData.citizenId}
        onChange={(e) =>
          setFormData({ ...formData, citizenId: e.target.value })
        }
        placeholder="e.g. 001234567890"
        className={`${inputCls} font-mono`}
      />
    </div>
  </div>
);

// ============================
// Step 3: Tax Code
// ============================
interface TaxCodeFormProps {
  formData: CreateNewHireDTO;
  setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>>;
}

const TaxCodeForm: React.FC<TaxCodeFormProps> = ({ formData, setFormData }) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
        Provide Tax Code
      </h1>
      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
        Enter tax information for payroll and legal compliance.
      </p>
    </div>

    <div>
      <label className={labelCls}>Personal Tax ID Number</label>
      <input
        type="text"
        value={formData.taxCode}
        onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
        placeholder="e.g. 0987654321"
        className={`${inputCls} font-mono`}
      />
    </div>
  </div>
);

// ============================
// Step 4: Address Verification
// ============================
interface AddressFormProps {
  formData: CreateNewHireDTO;
  setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>>;
}

const AddressVerificationForm: React.FC<AddressFormProps> = ({
  formData,
  setFormData,
}) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
        Verify Home Address
      </h1>
      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
        Provide the permanent residential address.
      </p>
    </div>

    <div>
      <label className={labelCls}>Full Address</label>
      <input
        type="text"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        placeholder="e.g. 123 Nguyen Hue, District 1, Ho Chi Minh City"
        className={inputCls}
      />
    </div>
  </div>
);

// ============================
// Default form state factory
// ============================
const makeDefaultFormData = (
  candidateName: string,
  candidatePhone: string,
  candidateEmail: string,
): CreateNewHireDTO => ({
  fullName: candidateName,
  phone: candidatePhone,
  email: candidateEmail,
  gender: "MALE",
  address: "",
  departmentId: "",
  positionId: "",
  citizenId: "",
  taxCode: "",
  dateOfBirth: "",
});

// ============================
// Main Component
// ============================
const CandidateProfileCompletion: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const candidateName = searchParams.get("name") || "";
  const candidateEmail = searchParams.get("email") || "";
  const candidatePhone = searchParams.get("phone") || "";
  const jobTitle = searchParams.get("job") || "";

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [credentials, setCredentials] = useState<NewHireCredentials | null>(
    null,
  );

  const [formData, setFormData] = useState<CreateNewHireDTO>(
    makeDefaultFormData(candidateName, candidatePhone, candidateEmail),
  );

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      const response = await apiClient.post(API_URL, formData);
      const data = response.data;

      setToast({ message: "Employee created successfully", type: "success" });
      setCredentials({
        username: data.username ?? "",
        rawPassword: data.rawPassword ?? "",
        fullName: data.fullName ?? formData.fullName,
      });
    } catch (err: unknown) {
      if (err instanceof Error && 'response' in err) {
        const axErr = err as { response?: { status: number; statusText: string; data?: { message?: string } } };
        const message =
          axErr.response?.data?.message ??
          `Error ${axErr.response?.status}: ${axErr.response?.statusText}`;
        setSubmitError(message);
        setToast({ message, type: "error" });
      } else {
        const message = "An unexpected error occurred.";
        setSubmitError(message);
        setToast({ message, type: "error" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = useCallback(() => {
    setCredentials(null);
    setFormData(
      makeDefaultFormData(candidateName, candidatePhone, candidateEmail),
    );
    setCurrentStep(0);
    navigate("/onboarding");
  }, [navigate, candidateName, candidatePhone, candidateEmail]);

  const handleGoBack = () => navigate("/onboarding");

  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <PersonalInfoForm formData={formData} setFormData={setFormData} />
        );
      case 1:
        return (
          <EmploymentDetailsForm
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 2:
        return <CitizenIdForm formData={formData} setFormData={setFormData} />;
      case 3:
        return <TaxCodeForm formData={formData} setFormData={setFormData} />;
      case 4:
        return (
          <AddressVerificationForm
            formData={formData}
            setFormData={setFormData}
          />
        );
      default:
        return (
          <PersonalInfoForm formData={formData} setFormData={setFormData} />
        );
    }
  };

  // Deterministic avatar color
  const avatarColors = [
    "bg-primary/15 text-primary",
    "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  ];
  const avatarColor =
    avatarColors[(formData.fullName?.charCodeAt(0) ?? 0) % avatarColors.length];
  const avatarInitials =
    formData.fullName
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const progressPct = Math.round((currentStep / steps.length) * 100);

  return (
    <>
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Credentials Modal */}
      {credentials && (
        <CredentialsModal
          credentials={credentials}
          onClose={handleModalClose}
        />
      )}

      <div className="space-y-6">
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          <button
            onClick={handleGoBack}
            className="hover:text-primary transition-colors cursor-pointer font-medium"
          >
            Onboarding
          </button>
          <span className="text-text-muted-light dark:text-text-muted-dark">
            <ChevronRightIcon />
          </span>
          <span className="text-text-primary-light dark:text-text-primary-dark font-semibold truncate max-w-xs">
            {formData.fullName || "New Employee"} — Profile Completion
          </span>
        </nav>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* ── Left Column: Candidate Card + Checklist ── */}
            <div className="w-full lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-6 flex flex-col gap-4">
              {/* Candidate Card */}
              <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card overflow-hidden animate-fade-in">
                {/* Mini hero */}
                <div className="h-14 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
                <div className="px-5 pb-5 -mt-7">
                  <div className="flex items-end gap-3 mb-4">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ring-4 ring-surface-light dark:ring-surface-dark ${avatarColor}`}
                    >
                      {avatarInitials}
                    </div>
                    <div className="pb-1">
                      <h2 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark leading-tight">
                        {formData.fullName || "New Employee"}
                      </h2>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                        {jobTitle || "Onboarding"}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        Profile Completion
                      </span>
                      <span className="font-bold text-primary">
                        {progressPct}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick info */}
                  {applicationId && (
                    <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark space-y-2">
                      {[
                        { label: "Email", value: formData.email },
                        { label: "Phone", value: formData.phone },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="flex justify-between items-center"
                        >
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                            {label}
                          </span>
                          <span className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark truncate max-w-[140px]">
                            {value || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Checklist / Stepper */}
              <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="px-4 py-3.5 border-b border-border-light dark:border-border-dark flex items-center gap-2">
                  <span className="text-primary">
                    <ChecklistIcon />
                  </span>
                  <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                    Checklist
                  </h3>
                  <span className="ml-auto text-[11px] font-semibold text-text-secondary-light dark:text-text-secondary-dark bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    {currentStep}/{steps.length}
                  </span>
                </div>

                {/* Steps */}
                <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {steps.map((step, index) => {
                    const isActive = currentStep === index;
                    const isCompleted = currentStep > index;

                    return (
                      <button
                        key={step.id}
                        onClick={() => setCurrentStep(index)}
                        className={`w-full text-left px-4 py-3.5 transition-colors flex items-center gap-3 cursor-pointer relative ${
                          isActive
                            ? "bg-primary/5 dark:bg-primary/10"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                        }`}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r-full" />
                        )}

                        {/* Step circle */}
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isCompleted
                              ? "border-primary bg-primary text-white"
                              : isActive
                                ? "border-primary text-primary"
                                : "border-gray-300 dark:border-gray-600 text-transparent"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckIcon />
                          ) : isActive ? (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          ) : null}
                        </div>

                        {/* Label */}
                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-xs block truncate ${
                              isActive
                                ? "font-bold text-text-primary-light dark:text-text-primary-dark"
                                : isCompleted
                                  ? "font-medium text-text-secondary-light dark:text-text-secondary-dark line-through decoration-gray-400"
                                  : "font-medium text-text-primary-light dark:text-text-primary-dark"
                            }`}
                          >
                            {step.title}
                          </span>
                          {isActive && (
                            <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark mt-0.5 truncate">
                              {step.description}
                            </p>
                          )}
                        </div>

                        {/* Badge */}
                        {!isCompleted && !isActive && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark whitespace-nowrap">
                            Pending
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                            Active
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                            Done
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Submit CTA */}
                <div className="p-4 border-t border-border-light dark:border-border-dark">
                  <button
                    className={`w-full py-2.5 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm ${
                      currentStep === steps.length - 1
                        ? "bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 cursor-pointer btn-primary-action"
                        : "bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark cursor-not-allowed"
                    }`}
                    disabled={currentStep !== steps.length - 1 || submitting}
                    onClick={handleSubmit}
                  >
                    <VerifiedIcon />
                    {submitting ? "Submitting…" : "Finish & Create Employee"}
                  </button>
                  <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark mt-2 text-center">
                    Complete all steps to enable submission
                  </p>
                </div>
              </div>
            </div>

            {/* ── Right Column: Main Form ── */}
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card overflow-hidden animate-fade-in">
                {/* Form content */}
                <div className="p-6 md:p-8 min-h-[480px]">
                  {renderContent()}

                  {/* Error alert */}
                  {submitError && (
                    <div className="mt-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
                      <span className="text-rose-500 mt-0.5">
                        <ErrorIcon />
                      </span>
                      <p className="text-sm font-medium text-rose-800 dark:text-rose-200">
                        {submitError}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Actions — MASTER.md: sticky bottom, clean border */}
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-between sticky bottom-0 z-10">
                  <button
                    onClick={handleGoBack}
                    className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-3">
                    {currentStep > 0 && (
                      <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-xl text-sm font-medium text-text-primary-light dark:text-text-primary-dark hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        <ArrowLeftIcon />
                        Back
                      </button>
                    )}

                    {currentStep < steps.length - 1 ? (
                      <button
                        onClick={handleNext}
                        className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold shadow-sm shadow-primary/20 transition-all cursor-pointer btn-primary-action"
                      >
                        <SaveIcon />
                        Save & Continue
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold shadow-sm shadow-primary/20 transition-all cursor-pointer btn-primary-action disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <VerifiedIcon />
                        )}
                        {submitting ? "Submitting…" : "Complete & Create"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CandidateProfileCompletion;
