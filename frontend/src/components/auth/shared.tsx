import React from "react";
import { AlertIcon } from "./icons";

/* ─── Input Field Component ──────────────────────────────────────────────── */
export interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  rightSlot?: React.ReactNode;
  required?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  disabled,
  autoComplete,
  rightSlot,
  required = false,
}) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={id}
      className="text-[13px] font-medium text-[#164E63] select-none"
    >
      {label}
      {required && (
        <span className="text-[#EF4444] ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>

    <div className="relative">
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[
          "w-full px-3.5 py-2 pr-10",
          "border rounded-lg",
          "text-sm font-body text-[#164E63]",
          "placeholder:text-gray-400 placeholder:select-none",
          "transition-all duration-200 ease-in-out",
          "outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50",
          error
            ? "border-[#EF4444] focus:border-[#EF4444] focus:shadow-[0_0_0_2px_rgba(239,68,68,0.15)] bg-red-50/10"
            : "border-gray-200 focus:border-[#0891B2] focus:shadow-[0_0_0_2px_rgba(8,145,178,0.13)] bg-white",
        ].join(" ")}
      />
      {rightSlot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {rightSlot}
        </div>
      )}
    </div>

    {error && (
      <p
        id={`${id}-error`}
        role="alert"
        className="flex items-start gap-1 text-[11px] text-[#EF4444] font-medium animate-fade-in"
      >
        <AlertIcon />
        {error}
      </p>
    )}
  </div>
);

/* ─── Divider Component ──────────────────────────────────────────────────── */
export interface DividerProps {
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({ label = "Or" }) => (
  <div className="flex items-center gap-3 my-0.5">
    <div className="flex-1 h-px bg-gray-100" aria-hidden="true" />
    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider select-none">
      {label}
    </span>
    <div className="flex-1 h-px bg-gray-100" aria-hidden="true" />
  </div>
);
