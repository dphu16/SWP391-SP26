import React from "react";
import { Avatar } from "../shared";
import { MailIcon, PhoneIcon, LocationIcon, BuildingIcon } from "./Icons";
import type { EmployeeDetailDTO } from "./types";
import { getStatusCfg } from "./types";

const ProfileCard: React.FC<{ detail: EmployeeDetailDTO }> = ({ detail }) => {
  const statusCfg = getStatusCfg(detail.status || "");

  return (
    <div className="rounded-2xl border border-border-light bg-surface-light shadow-card overflow-hidden sticky top-6 animate-fade-in">
      <div className="h-20 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />

      <div className="px-6 pb-6 -mt-10 flex flex-col items-center text-center">
        <div className="ring-4 ring-surface-light rounded-full mb-3">
          <Avatar
            name={detail.fullName || "?"}
            url={detail.avatarUrl}
            size="xl"
          />
        </div>

        <h2 className="text-base font-bold text-text-primary-light leading-tight">
          {detail.fullName || "—"}
        </h2>
        <p className="text-xs text-text-secondary-light mt-0.5 mb-3">
          {detail.positionTitle || "—"}
        </p>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${statusCfg.text} ${statusCfg.bg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {detail.status || "—"}
        </span>

        <p className="mt-3 text-[11px] font-mono text-text-muted-light bg-gray-100 px-2.5 py-1 rounded-lg">
          {detail.employeeCode || "—"}
        </p>
      </div>

      <div className="border-t border-border-light px-6 py-5 space-y-3.5">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-text-secondary-light">
            <MailIcon />
          </span>
          <span className="text-text-primary-light font-medium truncate text-xs">
            {detail.email || "—"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-text-secondary-light">
            <PhoneIcon />
          </span>
          <span className="text-text-primary-light font-medium text-xs">
            {detail.phone || "—"}
          </span>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <span className="text-text-secondary-light mt-0.5">
            <LocationIcon />
          </span>
          <span className="text-text-primary-light font-medium text-xs leading-relaxed">
            {detail.address || "—"}
          </span>
        </div>
      </div>

      <div className="border-t border-border-light px-6 py-5 space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light mb-1">
            Department
          </p>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary-light">
              <BuildingIcon />
            </span>
            <p className="text-sm font-medium text-text-primary-light">
              {detail.deptName || "—"}
            </p>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light mb-1">
            Role
          </p>
          <div className="flex flex-wrap gap-1.5">
            {detail.roles && detail.roles.length > 0 ? (
              detail.roles.map((r, i) => (
                <span
                  key={i}
                  className="inline-flex items-center text-xs font-medium text-text-secondary-light bg-gray-100 px-2.5 py-1 rounded-lg"
                >
                  {r.replace("ROLE_", "")}
                </span>
              ))
            ) : (
              <span className="text-sm font-medium text-text-muted-light">
                —
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
