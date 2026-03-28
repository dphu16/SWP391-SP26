import React from "react";
import { Avatar } from "../shared";
import { MailIcon, PhoneIcon, LocationIcon } from "./Icons";
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

      <div className="border-t border-border-light px-6 py-5 space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light mb-2.5">
            Direct Manager
          </p>
          <div className="flex items-center gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50 hover:bg-gray-50 transition-colors cursor-default group">
            <Avatar
              name={detail.managerName || "?"}
              url={detail.managerAvatar}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-text-primary-light truncate group-hover:text-primary transition-colors">
                {detail.managerName || "Not Assigned"}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light mb-2.5">
            Mentor
          </p>
          <div className="flex items-center gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50 hover:bg-gray-50 transition-colors cursor-default group">
            <Avatar
              name={detail.mentorName || "?"}
              url={detail.mentorAvatar}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-text-primary-light truncate group-hover:text-primary transition-colors">
                {detail.mentorName || "Not Assigned"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
