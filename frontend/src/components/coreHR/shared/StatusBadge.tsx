import React from "react";
import type { StatusStyle } from "./statusConfigs";
import { getStatusStyle } from "./statusConfigs";

interface StatusBadgeProps {
  status: string;
  config: Record<string, StatusStyle>;
  fallbackKey?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  config,
  fallbackKey = "INACTIVE",
}) => {
  const cfg = getStatusStyle(config, status, fallbackKey);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.text} ${cfg.bg} ${cfg.border ?? ""}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label ?? status}
    </span>
  );
};

export default StatusBadge;
