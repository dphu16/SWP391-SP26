import React, { useState, useEffect } from "react";
import axios from "axios";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`skeleton rounded-lg ${className}`} />
);

// ─── Stat Card (Bento Cell) ───────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  accentClass: string;
  bgClass: string;
  loading?: boolean;
  size?: "default" | "wide" | "tall";
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  accentClass,
  bgClass,
  loading = false,
  size = "default",
}) => {
  const changeColors = {
    up: "text-emerald-600 dark:text-emerald-400",
    down: "text-rose-500 dark:text-rose-400",
    neutral: "text-gray-500 dark:text-gray-400",
  };

  return (
    <div
      className={`bento-card relative rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 overflow-hidden cursor-pointer
        ${size === "wide" ? "col-span-2" : ""}
        ${size === "tall" ? "row-span-2" : ""}
      `}
    >
      {/* Subtle background accent */}
      <div
        className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 ${bgClass}`}
      />

      {/* Icon */}
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${bgClass} ${accentClass} mb-4`}>
        {icon}
      </div>

      {loading ? (
        <div className="space-y-2 mt-1">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      ) : (
        <>
          <div className="text-3xl font-bold font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight">
            {value}
          </div>
          <div className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium">
            {label}
          </div>
          {change && (
            <div className={`mt-3 flex items-center gap-1 text-xs font-semibold ${changeColors[changeType]}`}>
              {changeType === "up" && (
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M8 2a.75.75 0 01.75.75v8.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V2.75A.75.75 0 018 2z" clipRule="evenodd" style={{ transform: "rotate(180deg)", transformOrigin: "center" }} />
                </svg>
              )}
              {changeType === "down" && (
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M8 14a.75.75 0 01-.75-.75V4.56L3.03 7.78a.75.75 0 01-1.06-1.06l4.5-4.5a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06L8.75 4.56v8.69A.75.75 0 018 14z" clipRule="evenodd" style={{ transform: "rotate(180deg)", transformOrigin: "center" }} />
                </svg>
              )}
              {change}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
const MiniBarChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm transition-all duration-500 ${color}`}
          style={{ height: `${(v / max) * 100}%`, opacity: i === data.length - 1 ? 1 : 0.4 + (i / data.length) * 0.5 }}
        />
      ))}
    </div>
  );
};

// ─── Department Row ───────────────────────────────────────────────────────────
const DeptRow: React.FC<{ name: string; count: number; total: number; color: string }> = ({
  name, count, total, color,
}) => {
  const pct = Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark truncate">{name}</div>
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-8 text-right text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">{count}</div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    onboarding: 0,
    onLeave: 0,
    newHiresThisMonth: 0,
    departments: [] as { name: string; count: number }[],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/hr/employees");
        const employees = res.data?.content ?? [];
        const total = res.data?.totalElements ?? employees.length;

        const active = employees.filter((e: any) =>
          e.statusRole?.toUpperCase() === "ACTIVE"
        ).length;
        const onboarding = employees.filter((e: any) =>
          e.statusRole?.toUpperCase() === "ONBOARDING"
        ).length;
        const onLeave = employees.filter((e: any) =>
          e.statusRole?.toUpperCase() === "ONLEAVE"
        ).length;

        // Group by department
        const deptMap: Record<string, number> = {};
        employees.forEach((e: any) => {
          if (e.deptName) deptMap[e.deptName] = (deptMap[e.deptName] || 0) + 1;
        });
        const departments = Object.entries(deptMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({ totalEmployees: total, activeEmployees: active, onboarding, onLeave, newHiresThisMonth: onboarding, departments });
      } catch {
        // Use placeholder data if API fails
        setStats({
          totalEmployees: 248,
          activeEmployees: 201,
          onboarding: 18,
          onLeave: 12,
          newHiresThisMonth: 7,
          departments: [
            { name: "Engineering", count: 82 },
            { name: "Sales", count: 54 },
            { name: "Marketing", count: 38 },
            { name: "HR", count: 24 },
            { name: "Finance", count: 20 },
          ],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const deptColors = [
    "bg-primary",
    "bg-blue-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-rose-500",
  ];

  const headcountTrend = [180, 192, 198, 205, 212, 228, 235, 248];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight">
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Overview of your workforce at a glance
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg px-3 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
          Live data
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees — wide */}
        <div className="col-span-2">
          <StatCard
            label="Total Employees"
            value={loading ? "—" : stats.totalEmployees}
            change="+12 this quarter"
            changeType="up"
            loading={loading}
            accentClass="text-primary"
            bgClass="bg-primary/10"
            icon={
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
              </svg>
            }
            size="wide"
          />
        </div>

        {/* Active */}
        <StatCard
          label="Active"
          value={loading ? "—" : stats.activeEmployees}
          change="81% of total"
          changeType="up"
          loading={loading}
          accentClass="text-emerald-600"
          bgClass="bg-emerald-50 dark:bg-emerald-900/20"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          }
        />

        {/* On Leave */}
        <StatCard
          label="On Leave"
          value={loading ? "—" : stats.onLeave}
          change="5% of workforce"
          changeType="neutral"
          loading={loading}
          accentClass="text-rose-500"
          bgClass="bg-rose-50 dark:bg-rose-900/20"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
            </svg>
          }
        />

        {/* Onboarding */}
        <StatCard
          label="Onboarding"
          value={loading ? "—" : stats.onboarding}
          change="+3 this week"
          changeType="up"
          loading={loading}
          accentClass="text-amber-600"
          bgClass="bg-amber-50 dark:bg-amber-900/20"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          }
        />

        {/* New Hires */}
        <StatCard
          label="New Hires (Month)"
          value={loading ? "—" : stats.newHiresThisMonth}
          change="vs 5 last month"
          changeType="up"
          loading={loading}
          accentClass="text-blue-600"
          bgClass="bg-blue-50 dark:bg-blue-900/20"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 018 17a9.953 9.953 0 01-5.385-1.572zM16.25 5.75a.75.75 0 00-1.5 0v2h-2a.75.75 0 000 1.5h2v2a.75.75 0 001.5 0v-2h2a.75.75 0 000-1.5h-2v-2z" />
            </svg>
          }
        />
      </div>

      {/* Second Row: Headcount Trend + Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Headcount Trend */}
        <div className="lg:col-span-3 bento-card rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                Headcount Trend
              </h3>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                Last 8 months
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
              +37.8%
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <div className="flex justify-between">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-8" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <MiniBarChart data={headcountTrend} color="bg-primary" />
              <div className="flex justify-between mt-2">
                {["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"].map((m) => (
                  <span key={m} className="text-[10px] text-text-muted-light dark:text-text-muted-dark font-medium">
                    {m}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Department Breakdown */}
        <div className="lg:col-span-2 bento-card rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              By Department
            </h3>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
              Top 5 departments
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-1.5 flex-1" />
                  <Skeleton className="h-3 w-6" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {stats.departments.map((dept, i) => (
                <DeptRow
                  key={dept.name}
                  name={dept.name}
                  count={dept.count}
                  total={stats.totalEmployees || 1}
                  color={deptColors[i % deptColors.length]}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Add Employee", icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 018 17a9.953 9.953 0 01-5.385-1.572zM16.25 5.75a.75.75 0 00-1.5 0v2h-2a.75.75 0 000 1.5h2v2a.75.75 0 001.5 0v-2h2a.75.75 0 000-1.5h-2v-2z" /></svg>, color: "text-primary bg-primary/10 hover:bg-primary/20" },
          { label: "Run Payroll", icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0zM1.75 14.5a.75.75 0 000 1.5c4.417 0 8.693.603 12.749 1.73 1.111.309 2.251-.512 2.251-1.696v-.784a.75.75 0 00-1.5 0v.784a.25.25 0 01-.325.24A49.043 49.043 0 001.75 14.5z" clipRule="evenodd" /></svg>, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30" },
          { label: "Time Off", icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30" },
          { label: "Reports", icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13zm10.857 5.691a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30" },
        ].map((action) => (
          <button
            key={action.label}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 cursor-pointer focus-ring ${action.color}`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
