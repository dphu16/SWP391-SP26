import React from "react";
import { Avatar, StatusBadge } from "../shared";
import { EMPLOYEE_STATUS_CONFIG } from "../shared/statusConfigs";
import type { Employee } from "../hooks/types";

interface TableRowProps {
  emp: Employee;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onView: (id: string) => void;
  onDeactivate: (emp: Employee) => void;
}

const TableRow: React.FC<TableRowProps> = ({
  emp,
  isSelected,
  onToggle,
  onView,
  onDeactivate,
}) => {
  return (
    <tr
      className={`table-row-hover group ${isSelected ? "bg-primary/5" : "hover:bg-gray-50/80"}`}
    >
      <td className="pl-6 pr-4 py-3.5">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(emp.id)}
          className="w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-0 focus:ring-offset-0 bg-transparent cursor-pointer accent-primary"
          aria-label={`Select ${emp.fullName}`}
        />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar name={emp.fullName} url={emp.avatarUrl} />
          <div>
            <div className="font-semibold text-text-primary-light leading-snug">
              {emp.fullName}
            </div>
            <div className="text-[11px] text-text-secondary-light font-mono mt-0.5">
              {emp.employeeCode}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-text-primary-light">
        {emp.positionTitle || (
          <span className="text-text-muted-light">—</span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex flex-wrap gap-1.5 max-w-[150px]">
          {emp.roles?.length > 0 ? (
            emp.roles.map((r: string, i: number) => (
              <span
                key={i}
                className="text-xs font-medium text-text-secondary-light bg-gray-100 px-2 py-0.5 rounded-md"
              >
                {r.replace("ROLE_", "")}
              </span>
            ))
          ) : (
            <span className="text-xs font-medium text-text-muted-light">
              —
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3.5 text-text-primary-light">
        {emp.deptName || (
          <span className="text-text-muted-light">—</span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge
          status={emp.statusEmp}
          config={EMPLOYEE_STATUS_CONFIG}
        />
      </td>
      <td className="px-4 py-3.5 text-center sticky right-0 bg-surface-light">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onView(emp.id)}
            title="View profile"
            className="p-1.5 rounded-lg text-text-secondary-light hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              <path
                fillRule="evenodd"
                d="M1.38 8.28a1.2 1.2 0 010-.56 7.16 7.16 0 0113.24 0c.044.185.044.378 0 .56a7.16 7.16 0 01-13.24 0zM8 11a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={() => onDeactivate(emp)}
            title="HR Propose Offboarding"
            className="p-1.5 rounded-lg text-text-secondary-light hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z" />
              <path
                fillRule="evenodd"
                d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default TableRow;
