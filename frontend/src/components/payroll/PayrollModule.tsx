import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import EmployeePayrollView from "./EmployeePayrollView";
import HRPayrollView from "./HRPayrollView";
import TaxInsuranceReport from "./TaxInsuranceReport";
import FinancePayrollView from "./FinancePayrollView";
import HRBenefitManagementView from "./HRBenefitManagementView";
import EmployeeTRSView from "./EmployeeTRSView";

// ─── Shared helpers ────────────────────────────────────────────────────────────
export const fmt = (n?: number | null) =>
    n != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n) : "—";

export const getErrMsg = (e: unknown): string => {
    if (e && typeof e === "object" && "response" in e) {
        const res = (e as { response?: { data?: { message?: string } } }).response;
        if (res?.data?.message) return res.data.message;
    }
    if (e instanceof Error) return e.message;
    return "An unexpected error occurred.";
};

export const Badge: React.FC<{
    status: string;
    cfg: Record<string, { label: string; dot: string; text: string; bg: string; border: string }>;
}> = ({ status, cfg }) => {
    const c = cfg[status] ?? { label: status, dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
};

// ─── Icon exports (reused in other files) ──────────────────────────────
export const Icon = {
    layers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>,
    user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
    wallet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 7H4C2.9 7 2 7.9 2 9v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z" /><path d="M16 3H8L6 7h12l-2-4z" /><circle cx="16" cy="14" r="1.5" fill="currentColor" stroke="none" /></svg>,
    money: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 12h.01M18 12h.01" /></svg>,
    download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 3v13M7 11l5 5 5-5" /><path d="M3 19h18" /></svg>,
    print: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>,
    help: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3" /><circle cx="12" cy="17" r=".5" fill="currentColor" /></svg>,
    refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.5 9A9 9 0 005.2 5.2L1 10M23 14l-4.3 4.8A9 9 0 013.5 15" /></svg>,
    check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 6L9 17l-5-5" /></svg>,
    checkCircle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" /></svg>,
    search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>,
    edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6L6 18M6 6l12 12" /></svg>,
    chevronDown: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 9l6 6 6-6" /></svg>,
    warning: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    inbox: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" /></svg>,
    calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    trendUp: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
    eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
};

// ─── Breadcrumb navigation replacement for old banner ──────────────────────────────────
const PAYROLL_ROUTE_META: Record<string, { label: string; icon: React.ReactNode }> = {
    "/payroll/employee":    { label: "My Payslips",           icon: Icon.user },
    "/payroll/hr":          { label: "Payroll Management",    icon: Icon.layers },
    "/payroll/tax-report":  { label: "Tax & Insurance",       icon: Icon.shield },
    "/payroll/finance":     { label: "Finance Payment",       icon: Icon.wallet },
    "/payroll/cnb-manager": { label: "C&B Manager",           icon: Icon.layers },
    "/payroll/my-trs":      { label: "My Benefits",           icon: Icon.trendUp },
};

export const PayrollBreadcrumb: React.FC<{ path: string }> = ({ path }) => {
    const meta = PAYROLL_ROUTE_META[path] ?? { label: "Payroll", icon: Icon.money };
    return (
        <div className="mb-6">
            {/* Removed inner breadcrumb to avoid redundancy with global layout breadcrumbs */}
            
            {/* Big Page Title */}
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
                {meta.label}
            </h1>
        </div>
    );
};

/** @deprecated use PayrollBreadcrumb — kept for backwards compatibility */
export const PayrollHeader = PayrollBreadcrumb as unknown as React.FC<any>;

// ─── /payroll → redirect to /payroll/employee ─────────────────────────────────
const PayrollModule: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasRole, user } = useAuth();

    const canViewHR = hasRole("HR", "MANAGER");
    const canViewFinance = hasRole("FINANCE");

    const isHR = location.pathname.startsWith("/payroll/hr");
    const isTaxReport = location.pathname.startsWith("/payroll/tax-report");
    const isFinance = location.pathname.startsWith("/payroll/finance");
    const isCnBManager = location.pathname.startsWith("/payroll/cnb-manager");
    const isMyTRS = location.pathname.startsWith("/payroll/my-trs");

    // Redirect based on permissions and pathname
    useEffect(() => {
        // Auto redirect base path
        if (location.pathname === "/payroll") {
            if (canViewFinance && !user?.role.includes("HR") && !user?.role.includes("EMPLOYEE")) {
                navigate("/payroll/finance", { replace: true });
            } else {
                navigate("/payroll/employee", { replace: true });
            }
            return;
        }

        // Block unauthorized access
        if (isHR && !canViewHR) {
            navigate("/payroll/employee", { replace: true });
        }
        if (isTaxReport && !canViewHR) {
            navigate("/payroll/employee", { replace: true });
        }
        if (isFinance && !canViewFinance) {
            navigate("/payroll/employee", { replace: true });
        }
        if (isCnBManager && !canViewHR) {
            navigate("/payroll/employee", { replace: true });
        }
    }, [location.pathname, navigate, canViewHR, canViewFinance, isHR, isTaxReport, isFinance, isCnBManager, isMyTRS, user]);

    if (isTaxReport && canViewHR) {
        return (
            <>
                <PayrollBreadcrumb path="/payroll/tax-report" />
                <TaxInsuranceReport />
            </>
        );
    }

    if (isCnBManager && canViewHR) {
        return (
            <>
                <PayrollBreadcrumb path="/payroll/cnb-manager" />
                <HRBenefitManagementView />
            </>
        );
    }

    if (isMyTRS) {
        return (
            <>
                <PayrollBreadcrumb path="/payroll/my-trs" />
                <EmployeeTRSView />
            </>
        );
    }

    if (isFinance && canViewFinance) {
        return (
            <>
                <PayrollBreadcrumb path="/payroll/finance" />
                <FinancePayrollView />
            </>
        );
    }

    // If user has no HR permission but is at an HR path (will be redirected immediately)
    if (isHR && !canViewHR) return null;

    return (
        <>
            <PayrollBreadcrumb path={isHR ? "/payroll/hr" : "/payroll/employee"} />
            {isHR ? <HRPayrollView /> : <EmployeePayrollView />}
        </>
    );
};

export default PayrollModule;
