import React from "react";

const QuickAction: React.FC<{
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
  onClick: () => void;
}> = ({ id, label, desc, icon, accent, onClick }) => (
  <button
    id={id}
    onClick={onClick}
    className="bento-card w-full rounded-2xl border border-border-light bg-surface-light shadow-card p-4 flex items-center gap-4 text-left cursor-pointer group hover:border-primary/30 transition-colors"
  >
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent} group-hover:scale-110 transition-transform duration-200`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-text-primary-light leading-tight">
        {label}
      </p>
      <p className="text-[11px] text-text-secondary-light mt-0.5 leading-tight">
        {desc}
      </p>
    </div>
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className="w-4 h-4 text-text-muted-light ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <path
        fillRule="evenodd"
        d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 5.28a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  </button>
);

export default QuickAction;
