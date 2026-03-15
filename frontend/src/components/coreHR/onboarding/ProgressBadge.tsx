import React from "react";
import { PROGRESS_STATUS_CONFIG } from "../shared/statusConfigs";

const ProgressBadge: React.FC<{
  status: string | null;
  onClick?: () => void;
}> = ({ status, onClick }) => {
  const config = status ? PROGRESS_STATUS_CONFIG[status] : null;
  if (!config) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-gray-600 bg-gray-100 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        New
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all ${config.text} ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </button>
  );
};

export default ProgressBadge;
