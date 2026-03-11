import React from "react";
import SortIcon from "./SortIcon";
import { COLUMNS } from "./constants";

interface TableHeaderProps {
  allSelected: boolean;
  onToggleAll: () => void;
  sortField: string | null;
  sortDir: "asc" | "desc";
  onSort: (field: string) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  allSelected,
  onToggleAll,
  sortField,
  sortDir,
  onSort,
}) => {
  return (
    <thead className="sticky top-0 z-10 bg-surface-light">
      <tr className="border-b border-gray-100">
        <th className="pl-6 pr-4 py-4 w-10">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            className="w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-0 focus:ring-offset-0 bg-transparent cursor-pointer accent-primary"
            aria-label="Select all"
          />
        </th>
        {COLUMNS.map((col) => (
          <th
            key={col.key}
            className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light"
          >
            {col.key !== "statusEmp" && col.key !== "roles" ? (
              <button
                onClick={() => onSort(col.key)}
                className="flex items-center gap-1.5 hover:text-text-primary-light transition-colors cursor-pointer group"
              >
                {col.label}
                <SortIcon
                  field={col.key}
                  activeField={sortField}
                  dir={sortDir}
                />
              </button>
            ) : (
              col.label
            )}
          </th>
        ))}
        <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light text-center sticky right-0 bg-surface-light">
          Actions
        </th>
      </tr>
    </thead>
  );
};

export default TableHeader;
