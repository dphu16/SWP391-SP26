import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EmployeePayrollView from "./EmployeePayrollView";
import HRPayrollView from "./HRPayrollView";
import TaxInsuranceReport from "./TaxInsuranceReport";

// ─── Icon exports (dùng lại trong các file khác) ──────────────────────────────
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
};

// ─── Page Header dùng chung ────────────────────────────────────────────────────
export const PayrollHeader: React.FC<{
    title: string;
    subtitle: string;
    activeTab: "employee" | "hr";
}> = ({ title, subtitle, activeTab }) => {
    const navigate = useNavigate();
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 shadow-lg mb-5">
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                {/* Title */}
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0"
                        style={{ boxShadow: "0 0 24px rgba(16,185,129,0.35)" }}>
                        <span className="text-white scale-125">{Icon.layers}</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400/80">HRM System</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
                        <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
                    </div>
                </div>

                {/* Toggle */}
                <div className="flex items-center bg-white/5 backdrop-blur-sm rounded-xl p-1 border border-white/10 self-start sm:self-auto gap-1">
                    <button onClick={() => navigate("/payroll/employee")}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === "employee" ? "bg-emerald-500 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}>
                        {Icon.user} Employee
                    </button>
                    <button onClick={() => navigate("/payroll/hr")}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === "hr" ? "bg-emerald-500 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}>
                        {Icon.users} HR Manager
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── /payroll → redirect to /payroll/employee ─────────────────────────────────
const PayrollModule: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect /payroll → /payroll/employee
    React.useEffect(() => {
        if (location.pathname === "/payroll") {
            navigate("/payroll/employee", { replace: true });
        }
    }, [location.pathname, navigate]);

    // Render both views with their own header based on current path
    const isHR = location.pathname.startsWith("/payroll/hr");
    const isTaxReport = location.pathname.startsWith("/payroll/tax-report");

    if (isTaxReport) {
        return <TaxInsuranceReport />;
    }

    return (
        <div className="space-y-0">
            <PayrollHeader
                title={isHR ? "Payroll Management (HR)" : "My Payslips"}
                subtitle={isHR ? "Create, calculate and approve payroll batches" : "View payslips and send inquiries"}
                activeTab={isHR ? "hr" : "employee"}
            />
            {isHR ? <HRPayrollView /> : <EmployeePayrollView />}
        </div>
    );
};

export default PayrollModule;
