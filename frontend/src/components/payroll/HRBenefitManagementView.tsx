import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    getAllBenefits, createBenefit, assignBenefitToEmployee,
    type BenefitResponse, type BenefitRequest, type BenefitType, type AssignBenefitRequest
} from "../../services/payrollService";

import { Icon } from "./PayrollModule";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n?: number | null) =>
    n != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n) : "—";

const getErrMsg = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } | string } };
    if (typeof err?.response?.data === "string") return err.response.data;
    return err?.response?.data?.message ?? "An unexpected error occurred.";
};

const BenefitIcons = {
    money: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    medical: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
    book: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    gym: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>,
    car: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
    food: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" /></svg>,
    gift: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
};

const BENEFIT_TYPE_META: Record<BenefitType, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
    ALLOWANCE:      { label: "Allowance",      icon: BenefitIcons.money,   color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
    HEALTH_CARE:    { label: "Health Care",    icon: BenefitIcons.medical, color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200" },
    LEARNING:       { label: "Learning",       icon: BenefitIcons.book,    color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
    GYM:            { label: "Fitness",        icon: BenefitIcons.gym,     color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    TRANSPORTATION: { label: "Transport",      icon: BenefitIcons.car,     color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200" },
    MEALS:          { label: "Meals",          icon: BenefitIcons.food,    color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200" },
    OTHER:          { label: "Other",          icon: BenefitIcons.gift,    color: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-200" },
};

// ─── Create Benefit Modal ──────────────────────────────────────────────────────
const CreateBenefitModal: React.FC<{ onCreated: () => void; onClose: () => void }> = ({ onCreated, onClose }) => {
    const [form, setForm] = useState<BenefitRequest>({ name: "", benefitType: "ALLOWANCE" });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const handleSubmit = async () => {
        if (!form.name.trim()) { setErr("Benefit name cannot be empty."); return; }
        if (form.standardValue === undefined || form.standardValue <= 0) { setErr("Please enter a valid Standard Value (>0)."); return; }
        setBusy(true); setErr("");
        try {
            await createBenefit(form);
            onCreated();
        } catch (e) { setErr(getErrMsg(e)); }
        finally { setBusy(false); }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span className="text-violet-600">{BenefitIcons.gift}</span> Add New Benefit
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Create benefit package for company</p>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {err && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">{err}</div>}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Benefit Name *</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:outline-none"
                            placeholder="e.g., Premium Health Care Plan A" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Benefit Type</label>
                        <select value={form.benefitType} onChange={e => setForm(f => ({ ...f, benefitType: e.target.value as BenefitType }))}
                            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:outline-none bg-white">
                            {Object.entries(BENEFIT_TYPE_META).map(([key, meta]) => (
                                <option key={key} value={key}>{meta.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Standard Value (VND/month) *</label>
                        <input type="number" value={form.standardValue ?? ""} onChange={e => setForm(f => ({ ...f, standardValue: e.target.value ? Number(e.target.value) : undefined }))}
                            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:outline-none"
                            placeholder="e.g., 1500000" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
                        <textarea value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:outline-none resize-none"
                            rows={2} placeholder="Short description of the benefit package..." />
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">Cancel</button>
                    <button onClick={handleSubmit} disabled={busy}
                        className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-violet-700 disabled:opacity-50 cursor-pointer transition-colors">
                        {busy ? "Creating..." : "Create Benefit"}
                    </button>
                </div>
            </div>
        </div>
    );
    
    return createPortal(modalContent, document.body);
};

import { employeeService } from "../../services/employeeService";

// ─── Assign Benefit Modal ──────────────────────────────────────────────────────
const AssignBenefitModal: React.FC<{ benefits: BenefitResponse[]; onAssigned: () => void; onClose: () => void }> = ({ benefits, onAssigned, onClose }) => {
    const [form, setForm] = useState<AssignBenefitRequest>({
        employeeId: "", benefitId: "", startDate: new Date().toISOString().split("T")[0]
    });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState("");
    
    // Add employee name lookup state
    const [employeeName, setEmployeeName] = useState<string | null>(null);
    const [empLoading, setEmpLoading] = useState(false);

    // Effect to fetch employee name when employeeId changes length > 30 (UUID format approx)
    useEffect(() => {
        if (!form.employeeId || form.employeeId.length < 32) {
            setEmployeeName(null);
            return;
        }
        const findEmp = async () => {
            setEmpLoading(true);
            try {
                const res = await employeeService.getEmployeeDetail(form.employeeId);
                // Axios returns data wrapped in res.data, which contains our user obj. 
                // Depending on generic response parsing, we extract the name:
                const name = (res.data as any)?.user?.fullName || (res as any)?.user?.fullName || "Unknown Name";
                setEmployeeName(name);
                setErr("");
            } catch (e: any) {
                setEmployeeName(null);
                if (e?.response?.status === 404) {
                    setErr("No employee found with this ID.");
                } else if (e?.response?.status === 400 || e?.response?.status === 500) {
                     // ignore format errors until typing finishes
                }
            } finally {
                setEmpLoading(false);
            }
        };
        const timer = setTimeout(findEmp, 500); // debounce typing
        return () => clearTimeout(timer);
    }, [form.employeeId]);

    const handleSubmit = async () => {
        if (!form.employeeId.trim()) { setErr("Please enter Employee ID."); return; }
        if (!form.benefitId) { setErr("Please select a benefit."); return; }
        setBusy(true); setErr(""); setSuccess("");
        try {
            await assignBenefitToEmployee(form);
            setSuccess("✅ Benefit assigned successfully!");
            setTimeout(() => { 
                onAssigned(); 
                onClose(); // Auto close the modal after success
            }, 1200);
        } catch (e) { setErr(getErrMsg(e)); }
        finally { setBusy(false); }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span className="text-emerald-600">{Icon.user}</span> Assign Benefit to Employee
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Assign benefit package with application period</p>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {err && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">{err}</div>}
                    {success && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200 font-bold">{success}</div>}
                    <div>
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Employee ID *</label>
                            {empLoading && <span className="text-[10px] text-emerald-600 animate-pulse">Searching...</span>}
                        </div>
                        <input value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none placeholder-slate-300"
                            placeholder="Enter employee UUID..." />
                        
                        {employeeName && (
                             <div className="mt-1.5 flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                                 <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                     {employeeName.charAt(0).toUpperCase()}
                                 </span>
                                 <span className="text-xs font-medium text-slate-700">{employeeName}</span>
                             </div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select Benefit *</label>
                        <select value={form.benefitId} onChange={e => setForm(f => ({ ...f, benefitId: e.target.value }))}
                            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none bg-white">
                            <option value="">-- Select benefit package --</option>
                            {benefits.map(b => <option key={b.benefitId} value={b.benefitId}>{b.name} ({fmt(b.standardValue)}/month)</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Start Date *</label>
                            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">End Date</label>
                            <input type="date" value={form.endDate ?? ""} onChange={e => setForm(f => ({ ...f, endDate: e.target.value || undefined }))}
                                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Applied Value (Optional)</label>
                        <input type="number" value={form.appliedValue ?? ""} onChange={e => setForm(f => ({ ...f, appliedValue: e.target.value ? Number(e.target.value) : undefined }))}
                            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                            placeholder="Leave blank to use default value" />
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">Cancel</button>
                    <button onClick={handleSubmit} disabled={busy}
                        className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition-colors">
                        {busy ? "Processing..." : "Confirm Assignment"}
                    </button>
                </div>
            </div>
        </div>
    );
    
    return createPortal(modalContent, document.body);
};

// ─── Main Component ────────────────────────────────────────────────────────────
const HRBenefitManagementView: React.FC = () => {
    const [benefits, setBenefits] = useState<BenefitResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [showAssign, setShowAssign] = useState(false);
    const [filterType, setFilterType] = useState<BenefitType | "">("");

    const loadBenefits = useCallback(async () => {
        setLoading(true); setErr("");
        try {
            const page = await getAllBenefits(0, 100);
            setBenefits(page.content ?? []);
        } catch (e) { setErr(getErrMsg(e)); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadBenefits(); }, [loadBenefits]);

    const filtered = filterType ? benefits.filter(b => b.benefitType === filterType) : benefits;
    const stats = {
        total: benefits.length,
        active: benefits.filter(b => b.isActive).length,
        totalValue: benefits.reduce((s, b) => s + (b.standardValue ?? 0), 0),
    };

    return (
        <div className="flex flex-col pb-10 w-full relative z-0">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                <div className="bg-white rounded-[14px] border border-slate-200/60 p-5 shadow-sm relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute right-0 top-0 w-16 h-full bg-violet-50/50 flex flex-col items-center justify-center border-l border-violet-100/50 text-violet-400">
                        {BenefitIcons.gift}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Benefits</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-[28px] font-bold text-slate-800 tracking-tight leading-none">{stats.total}</p>
                        <span className="text-xs font-semibold text-slate-500">Packages</span>
                    </div>
                    <div className="mt-2 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit border border-emerald-100/50 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                        {stats.active} active
                    </div>
                </div>

                <div className="bg-white rounded-[14px] border border-slate-200/60 p-5 shadow-sm relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute right-0 top-0 w-16 h-full bg-blue-50/50 flex flex-col items-center justify-center border-l border-blue-100/50 text-blue-400">
                        {BenefitIcons.money}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Standard Value</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-[28px] font-bold text-slate-800 tracking-tight leading-none">{fmt(stats.totalValue).replace(/\s₫/g, "")}</p>
                        <span className="text-xs font-bold text-slate-600">₫</span>
                    </div>
                    <div className="mt-2 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full w-fit border border-slate-100/50">
                        Master catalog value
                    </div>
                </div>

                <div className="bg-white rounded-[14px] border border-slate-200/60 p-5 shadow-sm relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute right-0 top-0 w-16 h-full bg-emerald-50/50 flex flex-col items-center justify-center border-l border-emerald-100/50 text-emerald-400">
                        {Icon.layers}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categories</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-[28px] font-bold text-slate-800 tracking-tight leading-none">{Object.keys(BENEFIT_TYPE_META).length}</p>
                        <span className="text-xs font-semibold text-slate-500">Groups</span>
                    </div>
                    <div className="mt-2 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full w-fit border border-slate-100/50">
                        Standardized groups
                    </div>
                </div>
            </div>

            {err && <div className="p-4 mb-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-sm">{err}</div>}

            {/* Catalog Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 border border-violet-100/50 flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Benefit Catalog</h3>
                            <p className="text-[13px] text-slate-500 mt-0.5">Displaying {filtered.length} standardized benefit packages</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Filter by type */}
                        <div className="relative">
                            <select value={filterType} onChange={e => setFilterType(e.target.value as BenefitType | "")}
                                className="appearance-none pl-3 pr-8 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors cursor-pointer min-w-[140px]">
                                <option value="">All Types</option>
                                {Object.entries(BENEFIT_TYPE_META).map(([key, meta]) => (
                                    <option key={key} value={key}>{meta.label}</option>
                                ))}
                            </select>
                            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                        <button onClick={() => setShowAssign(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                            Assign
                        </button>
                        <button onClick={() => setShowCreate(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer border border-emerald-600/20">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            Add Benefit
                        </button>
                    </div>
                </div>

                {/* Grid of benefit cards */}
                <div className="p-5">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-36 bg-slate-100 animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center text-slate-400 flex flex-col items-center">
                            <div className="text-slate-300 mb-3">{BenefitIcons.gift}</div>
                            <p className="text-sm font-semibold text-slate-500">No benefits available. Please add the first benefit package!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map(b => {
                                const meta = BENEFIT_TYPE_META[b.benefitType] ?? BENEFIT_TYPE_META.OTHER;
                                return (
                                    <div key={b.benefitId}
                                        className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all hover:shadow-md ${b.isActive ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200 opacity-60"}`}>
                                        <div className="flex items-start justify-between">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${meta.bg} border ${meta.border} ${meta.color}`}>
                                                {meta.icon}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
                                                {meta.label}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm leading-tight">{b.name}</p>
                                            {b.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{b.description}</p>}
                                        </div>
                                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                                            <span className="text-sm font-black text-slate-900 tabular-nums">
                                                {b.standardValue ? fmt(b.standardValue) : <span className="text-slate-400 font-medium text-xs">Variable</span>}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                                                {b.isActive ? "● Active" : "○ Suspended"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreate && (
                <CreateBenefitModal onCreated={() => { setShowCreate(false); loadBenefits(); }} onClose={() => setShowCreate(false)} />
            )}
            {showAssign && (
                <AssignBenefitModal benefits={benefits} onAssigned={() => setShowAssign(false)} onClose={() => setShowAssign(false)} />
            )}
        </div>
    );
};

export default HRBenefitManagementView;
