import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import { getToken } from "../services/authService";
import { decodeJwt } from "../utils/jwtDecode";
import type { Employee, PageResponse } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  total: number;
  active: number;
  onboarding: number;
  onLeave: number;
  probation: number;
  inactive: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useCurrentUser() {
  const payload = decodeJwt(getToken());
  return {
    name: payload?.fullName ?? payload?.sub ?? "HR Manager",
    role: payload?.role ?? "HR",
    avatarUrl: payload?.avatarUrl ?? "",
  };
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function buildStats(employees: Employee[]): DashboardStats {
  const all = employees;
  return {
    total: all.length,
    active: all.filter((e) => e.statusRole?.toUpperCase() === "ACTIVE").length,
    onboarding: all.filter((e) => e.statusRole?.toUpperCase() === "ONBOARDING").length,
    onLeave: all.filter((e) => e.statusRole?.toUpperCase().replace(/\s/, "") === "ONLEAVE").length,
    probation: all.filter((e) => e.statusRole?.toUpperCase() === "PROBATION").length,
    inactive: all.filter((e) => e.statusRole?.toUpperCase() === "INACTIVE").length,
  };
}

// ─── Donut Chart (pure SVG) ───────────────────────────────────────────────────
interface DonutSlice {
  value: number;
  color: string;
  label: string;
}

const DonutChart: React.FC<{ slices: DonutSlice[]; total: number }> = ({ slices, total }) => {
  const R = 52;
  const cx = 64;
  const cy = 64;
  const circumference = 2 * Math.PI * R;

  let offset = 0;
  const paths = slices.map((s) => {
    const pct = total > 0 ? s.value / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const el = (
      <circle
        key={s.label}
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke={s.color}
        strokeWidth="20"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    );
    offset += dash;
    return el;
  });

  return (
    <svg viewBox="0 0 128 128" className="w-36 h-36 -rotate-90">
      {/* Track */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="currentColor" strokeWidth="20" className="text-gray-100 " />
      {total > 0 ? paths : null}
      {/* Center text */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-2xl font-bold fill-current"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fontSize: "22px", fontWeight: 700 }}
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fontSize: "9px", fill: "#94a3b8" }}
      >
        Total
      </text>
    </svg>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar: React.FC<{ name: string; url?: string; size?: string }> = ({ name, url, size = "w-9 h-9" }) => {
  const initials = name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() ?? "?";
  const colors = [
    "bg-primary/15 text-primary",
    "bg-blue-100 text-blue-600 ",
    "bg-amber-100 text-amber-700 ",
    "bg-rose-100 text-rose-600 ",
    "bg-cyan-100 text-cyan-600 ",
  ];
  const color = colors[(name?.charCodeAt(0) ?? 0) % colors.length];

  if (url) return <img src={url} alt={name} className={`${size} rounded-full object-cover ring-2 ring-white flex-shrink-0`} />;
  return (
    <div className={`${size} rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}>
      {initials}
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { dot: string; text: string; bg: string }> = {
  ACTIVE: { dot: "bg-emerald-500", text: "text-emerald-700 ", bg: "bg-emerald-50 " },
  ONBOARDING: { dot: "bg-amber-500", text: "text-amber-700 ", bg: "bg-amber-50 " },
  PROBATION: { dot: "bg-blue-500", text: "text-blue-700 ", bg: "bg-blue-50 " },
  ONLEAVE: { dot: "bg-rose-500", text: "text-rose-700 ", bg: "bg-rose-50 " },
  INACTIVE: { dot: "bg-gray-400", text: "text-gray-600 ", bg: "bg-gray-100 " },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const key = status?.toUpperCase().replace(/\s+/g, "") ?? "";
  const cfg = STATUS_CFG[key] ?? STATUS_CFG["INACTIVE"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.text} ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  id: string;
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  accent: string; // Tailwind bg + text classes for icon wrapper
  trend?: { value: string; positive: boolean };
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ id, label, value, sub, icon, accent, trend, onClick }) => (
  <div
    id={id}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    className={`bento-card rounded-2xl border border-border-light bg-surface-light shadow-card p-5 flex gap-4 items-start ${onClick ? "cursor-pointer" : ""}`}
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light ">
        {label}
      </p>
      <p className="text-2xl font-bold font-heading text-text-primary-light mt-0.5 leading-none">
        {value}
      </p>
      {sub && (
        <p className="text-xs text-text-secondary-light mt-1">{sub}</p>
      )}
      {trend && (
        <p className={`text-xs font-medium mt-1 ${trend.positive ? "text-emerald-600 " : "text-rose-600 "}`}>
          {trend.positive ? "↑" : "↓"} {trend.value}
        </p>
      )}
    </div>
  </div>
);

// ─── Quick Action Card ────────────────────────────────────────────────────────
const QuickAction: React.FC<{
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
  onClick: () => void;
}> = ({ id, label, desc, icon, accent, onClick }) => (
  <button
    id={id}
    onClick={onClick}
    className="bento-card w-full rounded-2xl border border-border-light bg-surface-light shadow-card p-4 flex items-center gap-4 text-left cursor-pointer group hover:border-primary/30 transition-colors"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent} group-hover:scale-110 transition-transform duration-200`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-text-primary-light leading-tight">{label}</p>
      <p className="text-[11px] text-text-secondary-light mt-0.5 leading-tight">{desc}</p>
    </div>
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-text-muted-light ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
      <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
  </button>
);

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  users: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
    </svg>
  ),
  document: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
    </svg>
  ),
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const HRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({ total: 0, active: 0, onboarding: 0, onLeave: 0, probation: 0, inactive: 0 });

  // Fetch first page (for recent list) + all pages for stats
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // First page for recent employees
      const firstPage = await apiClient.get<PageResponse<Employee>>("/api/hr/employees", {
        params: { page: 0, size: 6, sort: "fullName" },
      });
      setEmployees(firstPage.data.content);

      // Fetch all for total stats (up to 200 employees)
      const totalPages = Math.min(firstPage.data.totalPages, 20);
      let allEmps: Employee[] = [...firstPage.data.content];

      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            apiClient.get<PageResponse<Employee>>("/api/hr/employees", {
              params: { page: i + 1, size: 10, sort: "fullName" },
            })
          )
        );
        rest.forEach((r) => allEmps.push(...r.data.content));
      }

      setAllEmployees(allEmps);
      setStats(buildStats(allEmps));
    } catch {
      // Keep empty state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Donut slices
  const donutSlices: DonutSlice[] = [
    { value: stats.active, color: "#10b981", label: "Active" },
    { value: stats.onboarding, color: "#f59e0b", label: "Onboarding" },
    { value: stats.probation, color: "#3b82f6", label: "Probation" },
    { value: stats.onLeave, color: "#f43f5e", label: "On Leave" },
    { value: stats.inactive, color: "#94a3b8", label: "Inactive" },
  ].filter((s) => s.value > 0);

  const today = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ══ Welcome Hero ═══════════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden border border-border-light bg-surface-light shadow-card">
        {/* Gradient banner */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-teal-500/10 to-cyan-400/5 pointer-events-none" />
        <div className="absolute -right-8 -top-8 w-56 h-56 rounded-full bg-primary/8 pointer-events-none" />
        <div className="absolute right-24 top-4 w-24 h-24 rounded-full bg-teal-400/8 pointer-events-none" />

        <div className="relative px-7 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-text-secondary-light ">{today}</span>
            </div>
            <h1 className="text-2xl font-bold font-heading text-text-primary-light tracking-tight">
              {getGreeting()}, {currentUser.name.split(" ").at(-1)} 👋
            </h1>
            <p className="text-sm text-text-secondary-light mt-1">
              Here's what's happening across your organization today.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              id="dashboard-goto-employees"
              onClick={() => navigate("/employees")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer shadow-sm btn-primary-action"
            >
              {I.users}
              View Directory
            </button>
          </div>
        </div>
      </div>

      {/* ══ KPI Cards ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-[88px] rounded-2xl" />
          ))
        ) : (
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
              sub={stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% of workforce` : "—"}
              icon={<span className="text-emerald-600">{I.check}</span>}
              accent="bg-emerald-50 "
            />
            <KpiCard
              id="kpi-onboarding"
              label="Onboarding"
              value={stats.onboarding}
              sub="New hires in progress"
              icon={<span className="text-amber-500">{I.arrow}</span>}
              accent="bg-amber-50 "
              onClick={() => navigate("/onboarding")}
            />
            <KpiCard
              id="kpi-offboarding"
              label="On Leave"
              value={stats.onLeave}
              sub="Currently on leave"
              icon={<span className="text-rose-500">{I.clock}</span>}
              accent="bg-rose-50 "
            />
          </>
        )}
      </div>

      {/* ══ Middle Row: Status Breakdown + Quick Actions ═══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Status Breakdown */}
        <div className="rounded-2xl border border-border-light bg-surface-light shadow-card p-6 animate-fade-in">
          <h3 className="text-sm font-bold text-text-primary-light mb-5">
            Workforce Breakdown
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="skeleton w-36 h-36 rounded-full" />
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <DonutChart slices={donutSlices} total={stats.total} />

              {/* Legend */}
              <div className="space-y-2.5 flex-1">
                {[
                  { label: "Active", value: stats.active, color: "bg-emerald-500" },
                  { label: "Onboarding", value: stats.onboarding, color: "bg-amber-500" },
                  { label: "Probation", value: stats.probation, color: "bg-blue-500" },
                  { label: "On Leave", value: stats.onLeave, color: "bg-rose-500" },
                  { label: "Inactive", value: stats.inactive, color: "bg-gray-400" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
                      <span className="text-xs text-text-secondary-light ">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary-light ">
                        {item.value}
                      </span>
                      <span className="text-[10px] text-text-muted-light w-8 text-right">
                        {stats.total > 0 ? `${Math.round((item.value / stats.total) * 100)}%` : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 rounded-2xl border border-border-light bg-surface-light shadow-card p-6 animate-fade-in">
          <h3 className="text-sm font-bold text-text-primary-light mb-5">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickAction
              id="qa-employees"
              label="Employee Directory"
              desc="Browse and manage all staff"
              icon={<span className="text-primary">{I.users}</span>}
              accent="bg-primary/10"
              onClick={() => navigate("/employees")}
            />
            <QuickAction
              id="qa-onboarding"
              label="Onboarding"
              desc="Track new hire progress"
              icon={<span className="text-amber-500">{I.arrow}</span>}
              accent="bg-amber-50 "
              onClick={() => navigate("/onboarding")}
            />
            <QuickAction
              id="qa-offboarding"
              label="Offboarding"
              desc="Manage exits and resignations"
              icon={<span className="text-rose-500">{I.bolt}</span>}
              accent="bg-rose-50 "
              onClick={() => navigate("/offboarding")}
            />
            <QuickAction
              id="qa-request"
              label="Change Request"
              desc="Submit a personal info change"
              icon={<span className="text-blue-500">{I.document}</span>}
              accent="bg-blue-50 "
              onClick={() => navigate("/requests/new")}
            />
          </div>
        </div>
      </div>

      {/* ══ Recent Employees ════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-border-light bg-surface-light shadow-card animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary-light ">
            Employee Overview
          </h3>
          <button
            onClick={() => navigate("/employees")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
          >
            View all
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 ">
                {["Employee", "Position", "Department", "Role", "Status", ""].map((h) => (
                  <th key={h} className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light ">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 ">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className={`skeleton rounded h-4 ${j === 0 ? "w-36" : j === 5 ? "w-8" : "w-24"}`} />
                      </td>
                    ))}
                  </tr>
                ))
                : employees.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <p className="text-sm text-text-secondary-light ">No employees found.</p>
                      </td>
                    </tr>
                  )
                  : employees.map((emp) => (
                    <tr key={emp.id} className="group hover:bg-gray-50/80 table-row-hover">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.fullName} url={emp.avatarUrl} />
                          <div>
                            <p className="font-semibold text-text-primary-light leading-tight">
                              {emp.fullName}
                            </p>
                            <p className="text-[11px] font-mono text-text-muted-light mt-0.5">
                              {emp.employeeCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-text-primary-light ">
                        {emp.positionTitle || <span className="text-text-muted-light ">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-text-primary-light ">
                        {emp.deptName || <span className="text-text-muted-light ">—</span>}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs font-medium text-text-secondary-light bg-gray-100 px-2 py-0.5 rounded-md">
                          {emp.role || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={emp.statusRole} />
                      </td>
                      <td className="px-6 py-3.5">
                        <button
                          onClick={() => navigate(`/employee/${emp.id}`)}
                          title="View profile"
                          className="p-1.5 rounded-lg text-text-muted-light hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          {I.eye}
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && allEmployees.length > 6 && (
          <div className="px-6 py-3 border-t border-border-light flex items-center justify-between">
            <p className="text-xs text-text-secondary-light ">
              Showing <span className="font-semibold">6</span> of{" "}
              <span className="font-semibold">{stats.total}</span> employees
            </p>
            <button
              onClick={() => navigate("/employees")}
              className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
            >
              See all →
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default HRDashboard;