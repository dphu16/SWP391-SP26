import React from "react";

export const InfoRow: React.FC<{
  label: string;
  value: React.ReactNode;
  required?: boolean;
}> = ({ label, value, required }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light mb-1">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </p>
    <div className="text-sm font-medium text-text-primary-light">
  {value || "—"}
</div>
  </div>
);

export const SectionCard: React.FC<{
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, action, children }) => (
  <div className="rounded-2xl border border-border-light bg-surface-light shadow-card p-6 animate-fade-in">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-base font-bold text-text-primary-light tracking-tight">
        {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
);

export const IconButton: React.FC<{
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
  className?: string;
}> = ({
  onClick,
  title,
  children,
  variant = "default",
  disabled,
  className = "",
}) => {
  const variantClass = {
    default:
      "text-text-secondary-light hover:text-text-primary-light hover:bg-gray-100",
    primary: "text-white bg-primary hover:bg-primary-hover",
    danger: "text-rose-600 hover:text-rose-700 hover:bg-rose-50",
  }[variant];

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
};
