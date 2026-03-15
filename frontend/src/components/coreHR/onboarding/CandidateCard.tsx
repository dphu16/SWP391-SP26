import React from "react";
import type { CreateNewHireDTO } from "../hooks/types";

interface CandidateCardProps {
  formData: CreateNewHireDTO;
  jobTitle: string;
  progressPct: number;
  applicationId?: string;
}

const AVATAR_COLORS = [
  "bg-primary/15 text-primary",
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-600",
];

const CandidateCard: React.FC<CandidateCardProps> = ({
  formData,
  jobTitle,
  progressPct,
  applicationId,
}) => {
  const avatarColor =
    AVATAR_COLORS[
      (formData.fullName?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length
    ];
  const avatarInitials =
    formData.fullName
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="rounded-2xl border border-border-light bg-surface-light shadow-card overflow-hidden animate-fade-in">
      <div className="h-14 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
      <div className="px-5 pb-5 -mt-7">
        <div className="flex items-end gap-3 mb-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ring-4 ring-surface-light ${avatarColor}`}
          >
            {avatarInitials}
          </div>
          <div className="pb-1">
            <h2 className="text-sm font-bold text-text-primary-light leading-tight">
              {formData.fullName || "New Employee"}
            </h2>
            <p className="text-xs text-text-secondary-light mt-0.5">
              {jobTitle || "Onboarding"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-text-secondary-light">
              Completion Progress
            </span>
            <span className="font-bold text-primary">{progressPct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {applicationId && (
          <div className="mt-4 pt-4 border-t border-border-light space-y-2">
            {[
              { label: "Email", value: formData.email },
              { label: "Phone", value: formData.phone },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
                  {label}
                </span>
                <span className="text-xs font-medium text-text-primary-light truncate max-w-[130px]">
                  {value || "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateCard;
