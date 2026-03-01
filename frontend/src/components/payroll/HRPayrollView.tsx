import React, { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "./PayrollModule";
import {
    getBatches, createBatch, calculatePayroll,
    getBatchDetailsForReview, updatePayrollDetail, approveBatch, sendPayrollReport,
    getBatchDetailsForReview, updatePayrollDetail, approveBatch,
    type PayrollBatchDTO, type PayrollReviewDTO, type UpdatePayrollDetailRequest,
} from "../../services/payrollService";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n?: number | null) =>
    n != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n) : "—";

const fmtPeriod = (period?: string | null) => {
    if (!period) return "—";
    const d = new Date(period);
    return `Month ${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const getErrMsg = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } | string } };
    return typeof err?.response?.data === "string"
        ? err.response.data
        : err?.response?.data?.message ?? "An error occurred, please try again.";
};

// ─── Status config ─────────────────────────────────────────────────────────────
const BATCH_STATUS: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
    DRAFT: { label: "Draft", dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
    PROCESSED: { label: "Calculated", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    VALIDATED: { label: "Approved", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    LOCKED: { label: "Locked", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
};

// ─── Sub-components ────────────────────────────────────────────────────────────
const BatchBadge: React.FC<{ status: string }> = ({ status }) => {
    const c = BATCH_STATUS[status] ?? BATCH_STATUS.DRAFT;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.text} ${c.bg} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
};

const SkeletonRows = () => (
    <>{Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>{Array.from({ length: 10 }).map((__, j) => (
            <td key={j} className="px-4 py-4">
                <div className={`h-4 rounded bg-slate-100 animate-pulse ${j === 0 ? "w-32" : j === 1 ? "w-24" : "w-16"}`} />
            </td>
        ))}</tr>
    ))}</>
);

// ─── Create Batch Modal ────────────────────────────────────────────────────────
const CreateBatchModal: React.FC<{ onCreated: (b: PayrollBatchDTO) => void; onClose: () => void }> = ({ onCreated, onClose }) => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const create = async () => {
        setBusy(true); setErr("");
        try {
            const b = await createBatch(month, year);
            onCreated(b); onClose();
        } catch (e) { setErr(getErrMsg(e)); }
        finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                            <span className="text-white">{Icon.calendar}</span>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Create New Batch</h3>
                            <p className="text-xs text-slate-500">Select Month/Year</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">{Icon.close}</button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {err && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{Icon.warning} {err}</div>}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Month</label>
                            <select value={month} onChange={e => setMonth(Number(e.target.value))}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>Month {String(m).padStart(2, "0")}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Year</label>
                            <select value={year} onChange={e => setYear(Number(e.target.value))}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer">
                                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                        <p className="text-xs text-blue-700"><span className="font-semibold">Note:</span> After creating, click "Calculate" to calculate payroll for all employees.</p>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-white cursor-pointer">Cancel</button>
                    <button onClick={create} disabled={busy}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${busy ? "bg-emerald-400 text-white cursor-wait" : "bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"}`}>
                        {busy ? "Creating..." : "Create Batch"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Edit Detail Modal ─────────────────────────────────────────────────────────
const EditModal: React.FC<{ detail: PayrollReviewDTO; onSaved: () => void; onClose: () => void }> = ({ detail, onSaved, onClose }) => {
    const [ot, setOt] = useState(detail.totalOtHours ?? 0);
    const [abs, setAbs] = useState(detail.totalAbsentDays ?? 0);
    const [adj, setAdj] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const save = async () => {
        setBusy(true); setErr("");
        try {
            const req: UpdatePayrollDetailRequest = { totalOtHours: ot, totalAbsentDays: abs };
            if (adj.trim()) req.grossSalaryAdjustment = Number(adj);
            await updatePayrollDetail(detail.detailId, req);
            onSaved(); onClose();
        } catch (e) { setErr(getErrMsg(e)); }
        finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-white">{Icon.edit}</span>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Adjust Data</h3>
                            <p className="text-xs text-slate-500">{detail.employeeName}{detail.department && ` · ${detail.department}`}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">{Icon.close}</button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {err && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{Icon.warning} {err}</div>}
                    {detail.hasWarning && (
                        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
                            <span className="flex-shrink-0 mt-0.5">{Icon.warning}</span>
                            <span>{detail.warningMessage}</span>
                        </div>
                    )}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Base Salary</span>
                        <span className="text-sm font-bold text-slate-800">{fmt(detail.baseSalary)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">OT Hours</label>
                            <input type="number" min="0" value={ot} onChange={e => setOt(Number(e.target.value))}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Absent Days</label>
                            <input type="number" min="0" value={abs} onChange={e => setAbs(Number(e.target.value))}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                            Gross Adj. <span className="text-slate-400 font-normal normal-case">(optional)</span>
                        </label>
                        <input type="number" min="0" value={adj} onChange={e => setAdj(e.target.value)}
                            placeholder={`Current: ${fmt(detail.grossSalary)}`}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        <p className="text-[10px] text-slate-400 mt-1.5">Leave blank if no override needed.</p>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-white cursor-pointer">Cancel</button>
                    <button onClick={save} disabled={busy}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${busy ? "bg-blue-400 text-white cursor-wait" : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"}`}>
                        {busy ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Payroll Report Modal ──────────────────────────────────────────────────────
const PayrollReportModal: React.FC<{
    batch: PayrollBatchDTO;
    rows: PayrollReviewDTO[];
    onConfirm: () => void;
    onClose: () => void;
}> = ({ batch, rows, onConfirm, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);

    const totalGross = rows.reduce((s, r) => s + (r.grossSalary ?? 0), 0);
    const totalBase = rows.reduce((s, r) => s + (r.baseSalary ?? 0), 0);
    const totalOtPay = rows.reduce((s, r) => s + (r.otPay ?? 0), 0);
    const totalDeduct = rows.reduce((s, r) => s + (r.absentDeduction ?? 0), 0);
    const warnCount = rows.filter(r => r.hasWarning).length;
    const now = new Date();
    const reportDate = now.toLocaleString("vi-VN");
    const period = fmtPeriod(batch.period);

    const handleConfirm = async () => {
        setSending(true);
        await new Promise(r => setTimeout(r, 900)); // simulate send
        setSent(true);
        setSending(false);
        setTimeout(() => { onConfirm(); onClose(); }, 1400);
        try {
            await sendPayrollReport(batch.batchId);
            setSent(true);
            onConfirm(); // Trigger background refresh
        } catch (error: any) {
            console.error("Failed to send report:", error);
            alert(getErrMsg(error));
        } finally {
            setSending(false);
        }
    };

    const handlePrint = () => window.print();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[92vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-indigo-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Payroll Report for Finance</h2>
                            <p className="text-xs text-white/70">{period} · Created at {reportDate}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer transition-all">
                            {Icon.print} Print Report
                        </button>
                        <button onClick={onClose} className="p-1.5 rounded-lg text-white/60 hover:bg-white/10 cursor-pointer">{Icon.close}</button>
                    </div>
                </div>

                {/* Body — scrollable */}
                <div ref={printRef} className="flex-1 overflow-y-auto">
                    {!sent ? (
                        <>
                            {/* Summary strip */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-b border-slate-100">
                                {[
                                    { label: "Payroll Period", value: period, color: "text-violet-700" },
                                    { label: "Total Headcount", value: `${rows.length} emp.`, color: "text-slate-800" },
                                    { label: "Total Gross", value: fmt(totalGross), color: "text-emerald-700" },
                                    { label: "Warnings", value: `${warnCount} emp.`, color: warnCount > 0 ? "text-amber-600" : "text-slate-400" },
                                ].map((s, i) => (
                                    <div key={i} className={`px-6 py-4 ${i < 3 ? "border-r border-slate-100" : ""}`}>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
                                        <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>

                    {/* Summary strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-b border-slate-100">
                        {[
                            { label: "Payroll Period", value: period, color: "text-violet-700" },
                            { label: "Total Headcount", value: `${rows.length} emp.`, color: "text-slate-800" },
                            { label: "Total Gross", value: fmt(totalGross), color: "text-emerald-700" },
                            { label: "Warnings", value: `${warnCount} emp.`, color: warnCount > 0 ? "text-amber-600" : "text-slate-400" },
                        ].map((s, i) => (
                            <div key={i} className={`px-6 py-4 ${i < 3 ? "border-r border-slate-100" : ""}`}>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
                                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Breakdown cards */}
                    <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-slate-100 bg-slate-50/40">
                        {[
                            { label: "Total Base Salary", value: fmt(totalBase), color: "bg-blue-500" },
                            { label: "Total OT Pay", value: fmt(totalOtPay), color: "bg-amber-500" },
                            { label: "Total Deductions", value: fmt(totalDeduct), color: "bg-rose-500" },
                        ].map((c, i) => (
                            <div key={i} className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3">
                                <div className={`w-2 h-10 rounded-full ${c.color} flex-shrink-0`} />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{c.label}</p>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">{c.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Employee table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    {["No.", "Employee", "Department", "Base Salary", "OT (h)", "OT Pay", "Deduct", "Gross Salary", "Status"].map(h => (
                                        <th key={h} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {rows.map((r, idx) => (
                                    <tr key={r.detailId} className={r.hasWarning ? "bg-amber-50/40" : "hover:bg-slate-50/60"}>
                                        <td className="px-4 py-2.5 text-slate-400 font-mono">{String(idx + 1).padStart(2, "0")}</td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                                                    {r.employeeName?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-slate-800 whitespace-nowrap">{r.employeeName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">{r.department || "—"}</td>
                                        <td className="px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">{fmt(r.baseSalary)}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span className={r.totalOtHours > 0 ? "text-amber-600 font-semibold" : "text-slate-400"}>{r.totalOtHours ?? 0}h</span>
                                        </td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">{r.otPay > 0 ? fmt(r.otPay) : <span className="text-slate-300">—</span>}</td>
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            {r.absentDeduction > 0
                                                ? <span className="text-rose-600 font-medium">-{fmt(r.absentDeduction)}</span>
                                                : <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-4 py-2.5 font-bold text-slate-800 whitespace-nowrap">{fmt(r.grossSalary)}</td>
                                        <td className="px-4 py-2.5">
                                            {r.hasWarning
                                                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-200 whitespace-nowrap"><span className="w-1 h-1 rounded-full bg-amber-500" /> Warning</span>
                                                : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200"><span className="w-1 h-1 rounded-full bg-emerald-500" /> OK</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-200 bg-slate-50">
                                    <td colSpan={3} className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">Total ({rows.length} Emp.)</td>
                                    <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{fmt(totalBase)}</td>
                                    <td className="px-4 py-3" />
                                    <td className="px-4 py-3 font-bold text-amber-700 whitespace-nowrap">{fmt(totalOtPay)}</td>
                                    <td className="px-4 py-3 font-bold text-rose-600 whitespace-nowrap">-{fmt(totalDeduct)}</td>
                                    <td className="px-4 py-3 font-bold text-violet-700 text-sm whitespace-nowrap">{fmt(totalGross)}</td>
                                    <td className="px-4 py-3" />
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Notes */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-amber-50/30">
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            <span className="font-bold text-slate-700">Note:</span> This report was automatically generated from the HRM system on {reportDate}.
                            Gross Salary does not include deductions for Personal Income Tax and Social Insurances.
                            Please review carefully before sending to the Finance department.
                            {warnCount > 0 && <span className="text-amber-700 font-semibold"> There are {warnCount} employees requiring review.</span>}
                        </p>
                    </div>
                            {/* Notes */}
                            <div className="px-6 py-4 border-t border-slate-100 bg-amber-50/30">
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    <span className="font-bold text-slate-700">Note:</span> This report was automatically generated from the HRM system on {reportDate}.
                                    Gross Salary does not include deductions for Personal Income Tax and Social Insurances.
                                    Please review carefully before sending to the Finance department.
                                    {warnCount > 0 && <span className="text-amber-700 font-semibold"> There are {warnCount} employees requiring review.</span>}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-16 h-full min-h-[400px] text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-emerald-50">
                                <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-3">Report Sent Successfully!</h3>
                            <p className="text-slate-500 max-w-md leading-relaxed">
                                The system has saved the status and notified the Finance department to proceed with the review. The current payroll batch has been locked.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4 flex-shrink-0">
                    <div className="text-xs text-slate-400">
                        {sent
                            ? <span className="text-emerald-600 font-semibold flex items-center gap-1.5">{Icon.checkCircle} Report sent successfully!</span>
                            : <span>After confirmation, the report will be sent to the Finance department for review.</span>}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} disabled={sending || sent}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer transition-all">
                            Cancel
                        </button>
                        <button onClick={handleConfirm} disabled={sending || sent}
                            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${sent ? "bg-emerald-500 text-white cursor-default" :
                                sending ? "bg-violet-400 text-white cursor-wait" :
                                    "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 cursor-pointer"
                                }`}>
                            <span className={sending ? "animate-spin" : ""}>
                                {sent ? Icon.checkCircle : sending ? Icon.refresh : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                )}
                            </span>
                            {sent ? "Sent!" : sending ? "Sending..." : "Confirm & Send"}
                        </button>
                    </div>
                    {!sent ? (
                        <>
                            <div className="text-xs text-slate-400">
                                <span>After confirmation, the report will be sent to the Finance department for review.</span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={onClose} disabled={sending}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 cursor-pointer transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleConfirm} disabled={sending}
                                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${sending ? "bg-violet-400 text-white cursor-wait" :
                                        "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 cursor-pointer"
                                        }`}>
                                    <span className={sending ? "animate-spin" : ""}>
                                        {sending ? Icon.refresh : (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                            </svg>
                                        )}
                                    </span>
                                    {sending ? "Sending..." : "Confirm & Send"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full flex justify-end">
                            <button onClick={onClose}
                                className="px-8 py-2.5 rounded-xl text-sm font-bold bg-slate-800 text-white hover:bg-slate-900 transition-all cursor-pointer shadow-sm">
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
    label: string; value: string | number; icon: React.ReactNode; bg: string;
    valueColor?: string; subtitle?: string; active?: boolean; onClick?: () => void;
}> = ({ label, value, icon, bg, valueColor = "text-slate-800", subtitle, active, onClick }) => (
    <button onClick={onClick}
        className={`w-full rounded-2xl border bg-white shadow-sm p-5 flex items-start gap-4 text-left cursor-pointer transition-all hover:shadow-md ${active ? "border-emerald-400/40 ring-2 ring-emerald-400/10" : "border-slate-200 hover:border-slate-300"
            }`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${bg}`}>
            <span className="text-white scale-110">{icon}</span>
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
            <p className={`text-2xl font-bold leading-tight ${valueColor}`}>{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
    </button>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN: HR Payroll View
// ═══════════════════════════════════════════════════════════════════════════════
const HRPayrollView: React.FC = () => {
    // ── Batch state ────────────────────────────────────────────────────────────
    const [batches, setBatches] = useState<PayrollBatchDTO[]>([]);
    const [batchLoad, setBatchLoad] = useState(true);
    const [batchErr, setBatchErr] = useState("");
    const [selId, setSelId] = useState("");
    const [showCreate, setShowCreate] = useState(false);

    // ── Calculate state ────────────────────────────────────────────────────────
    const [calcState, setCalcState] = useState<"idle" | "busy" | "ok" | "err">("idle");
    const [calcErr, setCalcErr] = useState("");

    // ── Review table state ─────────────────────────────────────────────────────
    const [rows, setRows] = useState<PayrollReviewDTO[]>([]);
    const [rowsLoad, setRowsLoad] = useState(false);
    const [rowsLoaded, setRowsLoaded] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "ok" | "warning">("all");
    const [editRow, setEditRow] = useState<PayrollReviewDTO | null>(null);

    // ── Approve state ──────────────────────────────────────────────────────────
    const [approveBusy, setApproveBusy] = useState(false);
    const [approveMsg, setApproveMsg] = useState("");
    const [approveMsgType, setApproveMsgType] = useState<"ok" | "err">("ok");

    // ── Report state ───────────────────────────────────────────────────────────
    const [showReport, setShowReport] = useState(false);

    // ── Load batches ───────────────────────────────────────────────────────────
    const loadBatches = useCallback(async () => {
        setBatchLoad(true); setBatchErr("");
        try {
            const data = await getBatches();
            setBatches(data);
            if (data.length > 0) setSelId(id => id || data[0].batchId);
        } catch { setBatchErr("Could not load payroll batches."); }
        finally { setBatchLoad(false); }
    }, []);

    useEffect(() => { loadBatches(); }, []); // eslint-disable-line

    // ── Load review data whenever batch changes ────────────────────────────────
    const loadReview = useCallback(async (batchId: string) => {
        if (!batchId) return;
        setRowsLoad(true); setCalcErr(""); setApproveMsg(""); setRowsLoaded(false);
        try {
            const data = await getBatchDetailsForReview(batchId);
            setRows(data);
            setRowsLoaded(true);
        } catch {
            setRows([]);
            setRowsLoaded(true); // still mark loaded so UI shows "no data" state
            setCalcErr('No calculation data found for this batch. Click "Calculate" to start.');
        } finally { setRowsLoad(false); }
    }, []);

    useEffect(() => {
        if (selId) {
            setCalcState("idle"); setCalcErr(""); setApproveMsg("");
            loadReview(selId);
        }
    }, [selId, loadReview]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const onBatchCreated = (b: PayrollBatchDTO) => {
        setBatches(prev => [b, ...prev]);
        setSelId(b.batchId);
    };

    const handleCalculate = async () => {
        if (!selId) return;
        setCalcState("busy"); setCalcErr(""); setApproveMsg("");
        try {
            await calculatePayroll(selId);
            setCalcState("ok");
            const updated = await getBatches();
            setBatches(updated);
            await loadReview(selId);
        } catch (e) {
            setCalcState("err");
            setCalcErr(getErrMsg(e));
        }
    };

    const handleApprove = async () => {
        if (!selId) return;
        setApproveBusy(true); setApproveMsg("");
        try {
            const msg = await approveBatch(selId);
            setApproveMsg(msg || "Batch successfully approved!");
            setApproveMsgType("ok");
            const updated = await getBatches();
            setBatches(updated);
        } catch (e) {
            setApproveMsg(getErrMsg(e));
            setApproveMsgType("err");
        } finally { setApproveBusy(false); }
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const filtered = rows.filter(r => {
        const matchSearch = r.employeeName.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "all" || (filter === "warning" ? r.hasWarning : !r.hasWarning);
        return matchSearch && matchFilter;
    });

    const warnCount = rows.filter(r => r.hasWarning).length;
    const okCount = rows.filter(r => !r.hasWarning).length;
    const totalGross = rows.reduce((s, r) => s + (r.grossSalary ?? 0), 0);
    const selBatch = batches.find(b => b.batchId === selId);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            {/* ── Batch control panel ───────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-5">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                        <span className="text-white">{Icon.calendar}</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Payroll Management</h3>
                        <p className="text-xs text-slate-400">Select Batch → Calculate → Review → Approve</p>
                    </div>
                </div>

                <div className="px-6 py-5">
                    {/* Error banner */}
                    {batchErr && (
                        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
                            {Icon.warning} {batchErr}
                            <button onClick={loadBatches} className="ml-auto text-xs font-semibold text-rose-600 hover:underline cursor-pointer">Retry</button>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                        {/* Batch selector */}
                        <div className="flex-1 w-full sm:max-w-md">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Selected Batch</label>
                            {batchLoad ? (
                                <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
                            ) : batches.length === 0 ? (
                                <div className="px-4 py-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                                    No payroll batches found.{" "}
                                    <button onClick={() => setShowCreate(true)} className="text-emerald-600 font-semibold hover:underline cursor-pointer">Create new →</button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <select value={selId} onChange={e => setSelId(e.target.value)}
                                        className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer hover:border-emerald-300 transition-colors">
                                        {batches.map(b => (
                                            <option key={b.batchId} value={b.batchId}>
                                                {fmtPeriod(b.period)} — {BATCH_STATUS[b.status]?.label ?? b.status}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{Icon.chevronDown}</span>
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => setShowCreate(true)}
                                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer">
                                {Icon.money} New Batch
                            </button>
                            <button onClick={handleCalculate}
                                disabled={!selId || calcState === "busy" || batchLoad}
                                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm ${calcState === "busy" ? "bg-emerald-400 text-white cursor-wait" :
                                    calcState === "ok" ? "bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer" :
                                        !selId || batchLoad ? "bg-slate-200 text-slate-400 cursor-not-allowed" :
                                            "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 cursor-pointer"
                                    }`}>
                                <span className={calcState === "busy" ? "animate-spin" : ""}>
                                    {calcState === "ok" ? Icon.check : Icon.refresh}
                                </span>
                                {calcState === "busy" ? "Calculating..." : calcState === "ok" ? "Done" : "Calculate"}
                            </button>
                        </div>
                    </div>

                    {/* Batch info */}
                    {selBatch && !batchLoad && (
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                            <BatchBadge status={selBatch.status} />
                            <span className="text-xs text-slate-400">Batch ID:</span>
                            <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 max-w-xs truncate">
                                {selBatch.batchId}
                            </code>
                        </div>
                    )}

                    {/* Messages */}
                    {calcErr && (
                        <div className="mt-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
                            <span className="flex-shrink-0 mt-0.5">{Icon.warning}</span> {calcErr}
                        </div>
                    )}
                    {approveMsg && (
                        <div className={`mt-4 flex items-start gap-2 px-4 py-3 rounded-xl text-sm ${approveMsgType === "ok" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-rose-50 border border-rose-200 text-rose-700"
                            }`}>
                            <span className="flex-shrink-0 mt-0.5">{approveMsgType === "ok" ? Icon.checkCircle : Icon.warning}</span>
                            {approveMsg}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Stat cards (only when data loaded) ───────────────────────────── */}
            {rowsLoaded && rows.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                    <StatCard label="Total Employees" value={rows.length} icon={Icon.users}
                        bg="bg-gradient-to-br from-blue-500 to-indigo-600"
                        subtitle="In this batch"
                        active={filter === "all"} onClick={() => setFilter("all")} />
                    <StatCard label="Normal" value={okCount} icon={Icon.check}
                        bg="bg-gradient-to-br from-emerald-400 to-emerald-600"
                        valueColor="text-emerald-600" subtitle="No warnings"
                        active={filter === "ok"} onClick={() => setFilter(f => f === "ok" ? "all" : "ok")} />
                    <StatCard label="Warnings" value={warnCount} icon={Icon.warning}
                        bg="bg-gradient-to-br from-amber-400 to-orange-500"
                        valueColor={warnCount > 0 ? "text-amber-600" : "text-slate-400"} subtitle="Needs review"
                        active={filter === "warning"} onClick={() => setFilter(f => f === "warning" ? "all" : "warning")} />
                    <StatCard label="Total Gross" value={fmt(totalGross)} icon={Icon.money}
                        bg="bg-gradient-to-br from-violet-500 to-purple-600"
                        valueColor="text-violet-600" subtitle="Before deductions" />
                </div>
            )}

            {/* ── Review table ──────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Employee Payroll Table</h3>
                        {rows.length > 0 && (
                            <p className="text-xs text-slate-400 mt-0.5">
                                {filtered.length}/{rows.length} employees{selBatch && ` · ${fmtPeriod(selBatch.period)}`}
                            </p>
                        )}
                    </div>
                    {rows.length > 0 && (
                        <div className="flex items-center gap-2">
                            {/* Filter pills */}
                            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                {(["all", "ok", "warning"] as const).map(f => (
                                    <button key={f} onClick={() => setFilter(f)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${filter === f ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            }`}>
                                        {f === "all" ? "All" : f === "ok" ? "Normal" : "Warnings"}
                                    </button>
                                ))}
                            </div>
                            {/* Search */}
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{Icon.search}</span>
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee..."
                                    className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 w-44 transition-colors" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                {["Employee", "Department", "Base Salary", "OT (h)", "OT Pay", "Absent (d)", "Deduct", "Gross Salary", "Status", ""].map(h => (
                                    <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {rowsLoad ? (
                                <SkeletonRows />
                            ) : !rowsLoaded ? (
                                <tr><td colSpan={10} className="px-6 py-20 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <span className="scale-150">{Icon.refresh}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-600">Loading data...</p>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={10} className="px-6 py-16 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <span className="scale-150">{Icon.inbox}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-600">
                                        {rows.length === 0
                                            ? 'No data in this batch — click "Calculate" to start.'
                                            : "No matching results."}
                                    </p>
                                    {rows.length === 0 && (
                                        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                                            The system will automatically calculate payroll for all active employees.
                                        </p>
                                    )}
                                </td></tr>
                            ) : (
                                filtered.map(row => (
                                    <tr key={row.detailId}
                                        className={`group cursor-pointer transition-colors ${row.hasWarning ? "bg-amber-50/30 hover:bg-amber-50/60" : "hover:bg-slate-50/70"}`}
                                        onClick={() => setEditRow(row)}>
                                        {/* Name */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                                                    {row.employeeName?.charAt(0).toUpperCase() ?? "?"}
                                                </div>
                                                <span className="font-semibold text-slate-800 whitespace-nowrap">{row.employeeName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-500 text-xs">{row.department || "—"}</td>
                                        <td className="px-4 py-3.5 font-medium text-slate-700 whitespace-nowrap">{fmt(row.baseSalary)}</td>
                                        <td className="px-4 py-3.5">
                                            <span className={`font-semibold ${row.totalOtHours > 80 ? "text-amber-600" : "text-slate-700"}`}>
                                                {row.totalOtHours ?? 0}h
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">{fmt(row.otPay)}</td>
                                        <td className="px-4 py-3.5">
                                            <span className={row.totalAbsentDays > 0 ? "text-rose-600 font-semibold" : "text-slate-500"}>
                                                {row.totalAbsentDays ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            {row.absentDeduction
                                                ? <span className="text-rose-600 font-medium">-{fmt(row.absentDeduction)}</span>
                                                : <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="font-bold text-slate-800 whitespace-nowrap">{fmt(row.grossSalary)}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {row.hasWarning ? (
                                                <div>
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Warning
                                                    </span>
                                                    {row.warningMessage && <p className="text-[10px] text-slate-400 mt-0.5 max-w-[140px] truncate">{row.warningMessage}</p>}
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> OK
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <button onClick={e => { e.stopPropagation(); setEditRow(row); }}
                                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
                                                {Icon.edit}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer: approve */}
                {rowsLoaded && rows.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1.5 text-emerald-700">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="font-semibold">{okCount}</span> normal
                            </span>
                            {warnCount > 0 && (
                                <span className="flex items-center gap-1.5 text-amber-700">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="font-semibold">{warnCount}</span> warnings
                                </span>
                            )}
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500 text-xs">Total gross: <span className="font-semibold text-slate-700">{fmt(totalGross)}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Send Report button */}
                            <button onClick={() => setShowReport(true)}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-400 transition-all cursor-pointer shadow-sm">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <polyline points="10 9 9 9 8 9" />
                                </svg>
                                Send Report
                            </button>
                            {/* Approve button */}
                            <button onClick={handleApprove} disabled={approveBusy}
                                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${approveBusy ? "bg-emerald-400 text-white cursor-wait" : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 cursor-pointer"
                                    }`}>
                                <span className={approveBusy ? "animate-spin" : ""}>{approveBusy ? Icon.refresh : Icon.checkCircle}</span>
                                {approveBusy ? "Processing..." : "Validate & Approve Batch"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreate && <CreateBatchModal onCreated={onBatchCreated} onClose={() => setShowCreate(false)} />}
            {editRow && <EditModal detail={editRow} onSaved={() => loadReview(selId)} onClose={() => setEditRow(null)} />}
            {showReport && selBatch && (
                <PayrollReportModal
                    batch={selBatch}
                    rows={rows}
                    onConfirm={() => setApproveMsg("Report sent to Finance successfully!")}
                    onClose={() => setShowReport(false)}
                />
            )}
        </>
    );
};

export default HRPayrollView;
