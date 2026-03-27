import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type UserRole } from "../../hooks/useAuth";
import WelcomeHero from "./dashboard/WelcomeHero";
import { useHRDashboard } from "./hooks/useHRDashboard";
import KpiCard from "./dashboard/KpiCard";
import Icons from "./dashboard/Icons";

/* ─────────────────────────────────────────────────
   Quick-action config: define per-role action tiles
───────────────────────────────────────────────── */
interface ActionDef {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
  route: string;
  roles: UserRole[];
}

const I = Icons;

const ALL_ACTIONS: ActionDef[] = [
  /* ── HR ── */
  {
    id: "qa-employees",
    label: "Employee Directory",
    desc: "Browse and manage all staff",
    icon: <span className="text-primary">{I.users}</span>,
    accent: "bg-primary/10",
    route: "/employees",
    roles: ["HR", "MANAGER"],
  },
  {
    id: "qa-onboarding",
    label: "Onboarding",
    desc: "Track new hire progress",
    icon: <span className="text-amber-500">{I.arrow}</span>,
    accent: "bg-amber-50",
    route: "/onboarding",
    roles: ["HR"],
  },
  {
    id: "qa-offboarding",
    label: "Offboarding",
    desc: "Manage exits and resignations",
    icon: <span className="text-rose-500">{I.bolt}</span>,
    accent: "bg-rose-50",
    route: "/offboarding",
    roles: ["HR", "MANAGER"],
  },
  {
    id: "qa-recruitment",
    label: "Recruitment",
    desc: "Manage job postings & candidates",
    icon: <span className="text-violet-500">{I.list}</span>,
    accent: "bg-violet-50",
    route: "/recruitment/jobs",
    roles: ["HR"],
  },
  {
    id: "qa-payroll-hr",
    label: "Payroll",
    desc: "Process and review payroll",
    icon: <span className="text-emerald-600">{I.check}</span>,
    accent: "bg-emerald-50",
    route: "/payroll/hr",
    roles: ["HR", "MANAGER", "FINANCE"],
  },
  /* ── MANAGER ── */
  {
    id: "qa-attendance-review",
    label: "Attendance Review",
    desc: "Approve leave & attendance requests",
    icon: <span className="text-blue-500">{I.clock}</span>,
    accent: "bg-blue-50",
    route: "/attendance/review",
    roles: ["MANAGER", "HR"],
  },
  {
    id: "qa-performance",
    label: "Performance",
    desc: "View team performance data",
    icon: <span className="text-primary">{I.eye}</span>,
    accent: "bg-primary/10",
    route: "/performance",
    roles: ["MANAGER", "HR", "EMPLOYEE", "MENTOR"],
  },
  /* ── EMPLOYEE / INTERN / PROBATION ── */
  {
    id: "qa-my-trs",
    label: "My Benefits",
    desc: "View your total rewards statement",
    icon: <span className="text-emerald-600">{I.document}</span>,
    accent: "bg-emerald-50",
    route: "/payroll/my-trs",
    roles: ["EMPLOYEE", "FINANCE", "MENTOR", "HR", "MANAGER"],
  },
  {
    id: "qa-attendance-personal",
    label: "My Attendance",
    desc: "Check your schedule & leave",
    icon: <span className="text-blue-500">{I.clock}</span>,
    accent: "bg-blue-50",
    route: "/attendance/view-schedule",
    roles: ["EMPLOYEE", "MENTOR"],
  },
];

/* ─────────────────────────────────────────────
   Role badge: small colored chip for current role
───────────────────────────────────────────────── */
const ROLE_BADGE: Record<UserRole, { label: string; cls: string }> = {
  HR: { label: "HR Manager", cls: "bg-primary/10 text-primary" },
  MANAGER: { label: "Manager", cls: "bg-violet-100 text-violet-700" },
  EMPLOYEE: { label: "Employee", cls: "bg-emerald-100 text-emerald-700" },
  FINANCE: { label: "Finance", cls: "bg-amber-100 text-amber-700" },
  MENTOR: { label: "Mentor", cls: "bg-blue-100 text-blue-700" },
};

/* ─────────────────────────────────────────
   Quick-action tile (reusable inside component)
───────────────────────────────────────────── */
const ActionTile: React.FC<ActionDef & { onClick: () => void }> = ({
  id,
  label,
  desc,
  icon,
  accent,
  onClick,
}) => (
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
    <div className="min-w-0 flex-1">
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

/* ─────────────────────
   HR-only KPI section (conditionally shown)
───────────────────────── */
const HrKpiSection: React.FC<{
  loading: boolean;
  stats: ReturnType<typeof useHRDashboard>["stats"];
}> = ({ loading, stats }) => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-[88px] rounded-2xl" />
          ))
        : (
          <>
            <KpiCard
              id="kpi-total"
              label="Total Employees"
              value={stats.total}
              sub="In the system"
              icon={<span className="text-primary">{I.users}</span>}
              accent="bg-primary/10"
              onClick={() => navigate("/employees")}
            />
            <KpiCard
              id="kpi-active"
              label="Active"
              value={stats.active}
              sub={
                stats.total > 0
                  ? `${Math.round((stats.active / stats.total) * 100)}% of workforce`
                  : "—"
              }
              icon={<span className="text-emerald-600">{I.check}</span>}
              accent="bg-emerald-50"
            />
            <KpiCard
              id="kpi-onboarding"
              label="Onboarding"
              value={stats.onboarding}
              sub="New hires in progress"
              icon={<span className="text-amber-500">{I.arrow}</span>}
              accent="bg-amber-50"
              onClick={() => navigate("/onboarding")}
            />
            <KpiCard
              id="kpi-on-leave"
              label="On Leave"
              value={stats.onLeave}
              sub="Currently on leave"
              icon={<span className="text-rose-500">{I.clock}</span>}
              accent="bg-rose-50"
            />
          </>
        )}
    </div>
  );
};

/* ═══════════════════════════════════
   Main: Welcome Dashboard (all roles)
═══════════════════════════════════ */
const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role ?? "EMPLOYEE";
  const navigate = useNavigate();
  const { loading, stats, today } = useHRDashboard();

  const isHR = role === "HR";

  /* Filter actions by current role */
  const actions = useMemo(
    () => ALL_ACTIONS.filter((a) => a.roles.includes(role as UserRole)),
    [role],
  );

  const badge = ROLE_BADGE[role as UserRole] ?? {
    label: role,
    cls: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Welcome hero ── */}
      <WelcomeHero today={today} />

      {/* ── Role badge + subtitle ── */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${badge.cls}`}
        >
          {badge.label}
        </span>
        <span className="text-sm text-text-secondary-light">
          {isHR
            ? "Full access to HR operations and workforce data."
            : role === "MANAGER"
            ? "Manage your team's performance, attendance and approvals."
            : role === "FINANCE"
            ? "Access payroll, tax reports and compensation data."
            : role === "MENTOR"
            ? "Guide your mentees and track their development."
            : "View your personal schedule, benefits and performance."}
        </span>
      </div>

      {/* ── HR: org-wide KPI cards ── */}
      {isHR && <HrKpiSection loading={loading} stats={stats} />}

      {/* ── Quick actions grid (role-filtered) ── */}
      <div className="rounded-2xl border border-border-light bg-surface-light shadow-card p-6 animate-fade-in">
        <h3 className="text-sm font-bold text-text-primary-light mb-5">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {actions.map((a) => (
            <ActionTile
              key={a.id}
              {...a}
              onClick={() => navigate(a.route)}
            />
          ))}
        </div>
      </div>

      {/* ── Motivational footer strip ── */}
      <div className="rounded-2xl border border-border-light bg-gradient-to-r from-primary/5 via-teal-500/5 to-cyan-400/5 px-7 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-primary-light">
            Need help getting started?
          </p>
          <p className="text-xs text-text-secondary-light mt-0.5">
            Explore the sidebar to navigate all modules available to your role.
          </p>
        </div>
        <button
          id="dashboard-explore-btn"
          onClick={() => navigate(isHR ? "/employees" : "/payroll/my-trs")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer shadow-sm flex-shrink-0"
        >
          {isHR ? I.users : I.document}
          {isHR ? "View Employees" : "View My Benefits"}
        </button>
      </div>
    </div>
  );
};

export default HRDashboard;
