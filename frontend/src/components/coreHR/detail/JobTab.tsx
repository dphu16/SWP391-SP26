import React from "react";
import type { EmployeeDetailDTO, ContractDTO } from "./types";
import { formatDate } from "./types";
import { InfoRow, SectionCard, IconButton } from "./ui";
import { EditIcon } from "./Icons";

interface JobTabProps {
  detail: EmployeeDetailDTO;
}

const isExpiringSoon = (endDate: string): boolean => {
  if (!endDate) return false;
  const end = new Date(endDate);
  const now = new Date();
  const diffDays = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 30;
};

const ContractStatusBadge: React.FC<{ contract: ContractDTO }> = ({ contract }) => {
  const expiring = contract.status === "ACTIVE" && isExpiringSoon(contract.endDate);
  if (expiring) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Expiring Soon
      </span>
    );
  }
  const colors: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    EXPIRED: "bg-gray-100 text-gray-500",
    TERMINATED: "bg-rose-50 text-rose-700",
  };
  const cls = colors[contract.status] || "bg-gray-100 text-gray-500";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      {contract.status}
    </span>
  );
};

const JobTab: React.FC<JobTabProps> = ({ detail }) => {
  const contracts = detail.contracts ?? [];

  return (
    <>
      <SectionCard
        title="Job Information"
        action={
          <IconButton title="Edit job info" variant="default">
            <EditIcon />
          </IconButton>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
          <InfoRow
            label="Role"
            value={
              <div className="flex flex-wrap gap-1">
                {detail?.roles && detail.roles.length > 0 ? (
                  detail.roles.map((r, i) => (
                    <span
                      key={i}
                      className="text-text-secondary-light bg-gray-100 px-2 py-0.5 rounded-md font-medium text-xs"
                    >
                      {r.replace("ROLE_", "")}
                    </span>
                  ))
                ) : (
                  <span className="text-text-muted-light">—</span>
                )}
              </div>
            }
          />
          <InfoRow label="Position" value={detail?.positionTitle} />
          <InfoRow label="Department" value={detail?.deptName} />
          <InfoRow
            label="Status"
            value={
              detail?.statusEmp ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-text-secondary-light bg-gray-100">
                  {detail.statusEmp}
                </span>
              ) : (
                "—"
              )
            }
          />
        </div>
      </SectionCard>

      {contracts.length > 0 && (
        <SectionCard title="Contracts">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">Contract #</th>
                  <th className="text-left py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">Type</th>
                  <th className="text-left py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">Start Date</th>
                  <th className="text-left py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">End Date</th>
                  <th className="text-left py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">Status</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.contractId} className="border-b border-border-light/50 last:border-0">
                    <td className="py-2.5 px-3 font-medium text-text-primary-light">{c.contractNumber}</td>
                    <td className="py-2.5 px-3 text-text-secondary-light">{c.contractType}</td>
                    <td className="py-2.5 px-3 text-text-secondary-light">{formatDate(c.startDate)}</td>
                    <td className="py-2.5 px-3 text-text-secondary-light">{formatDate(c.endDate)}</td>
                    <td className="py-2.5 px-3">
                      <ContractStatusBadge contract={c} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </>
  );
};

export default JobTab;
