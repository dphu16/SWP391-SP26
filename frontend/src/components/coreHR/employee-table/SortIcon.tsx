import React from "react";

const SortIcon: React.FC<{
  field: string;
  activeField: string | null;
  dir: "asc" | "desc";
}> = ({ field, activeField, dir }) => (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    className={`w-3.5 h-3.5 transition-colors ${activeField === field ? "text-primary" : "text-gray-300 group-hover:text-gray-400"}`}
  >
    <path
      fillRule="evenodd"
      d="M8 2a.75.75 0 01.75.75v8.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V2.75A.75.75 0 018 2z"
      clipRule="evenodd"
      style={
        activeField === field && dir === "asc"
          ? { transform: "rotate(180deg)", transformOrigin: "center" }
          : undefined
      }
    />
  </svg>
);

export default SortIcon;
