import React, { useState, useEffect, useCallback } from "react";
import { getBatches, getTaxInsuranceReport, sendPayrollReport, type PayrollBatchDTO, type TaxInsuranceDTO } from "../../services/payrollService";
import { getBatches, getBatchDetailsForReview, type PayrollBatchDTO, type PayrollReviewDTO } from "../../services/payrollService";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n?: number | null) =>
    n != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n) : "—";

const fmtPeriod = (period?: string | null) => {
    if (!period) return "—";
    const d = new Date(period);
    return `Month ${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

// Calculate progressive PIT (Personal Income Tax) in VN
function calcPIT(gross: number): number {
    const ins = gross * 0.105;
    const taxable = gross - ins;
    const assess = taxable - 11_000_000;
    if (assess <= 0) return 0;
    let tax = 0;
    if (assess <= 5_000_000) tax = assess * 0.05;
    else if (assess <= 10_000_000) tax = assess * 0.10 - 250_000;
    else if (assess <= 18_000_000) tax = assess * 0.15 - 750_000;
    else if (assess <= 32_000_000) tax = assess * 0.20 - 1_650_000;
    else if (assess <= 52_000_000) tax = assess * 0.25 - 3_250_000;
    else if (assess <= 80_000_000) tax = assess * 0.30 - 5_850_000;
    else tax = assess * 0.35 - 9_850_000;
    return Math.max(tax, 0);
}

// Insurance rates
const INS_RATE = 0.105; // 8% BHXH + 1.5% BHYT + 1% BHTN
const BHXH_RATE = 0.08;
const BHYT_RATE = 0.015;
const BHTN_RATE = 0.01;

interface TaxRow {
    name: string;
    dept: string;
    gross: number;
    baseSalary: number;
    bhxh: number;
    bhyt: number;
    bhtn: number;
    totalIns: number;
    pit: number;
    totalDeduct: number;
    net: number;
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
const IcReport = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
);
const IcSend = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);
const IcCheck = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M20 6L9 17l-5-5" />
    </svg>
);
const IcRefresh = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.5 9A9 9 0 005.2 5.2L1 10M23 14l-4.3 4.8A9 9 0 013.5 15" />
    </svg>
);
const IcChevron = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M6 9l6 6 6-6" />
    </svg>
);
const IcShield = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);
const IcTax = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3" /><circle cx="12" cy="17" r=".5" fill="currentColor" />
    </svg>
);
const IcUsers = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
);

// ─── Confirm Modal ─────────────────────────────────────────────────────────────
const ConfirmModal: React.FC<{
    batch: PayrollBatchDTO;
    rows: TaxInsuranceDTO[];
    rows: TaxRow[];
    onSend: () => void;
    onClose: () => void;
    sending: boolean;
    sent: boolean;
}> = ({ batch, rows, onSend, onClose, sending, sent }) => {
}> = ({ batch, rows, onSend, onClose }) => {
    const totalPIT = rows.reduce((s, r) => s + r.pit, 0);
    const totalIns = rows.reduce((s, r) => s + r.totalIns, 0);
    const totalBHXH = rows.reduce((s, r) => s + r.bhxh, 0);
    const totalBHYT = rows.reduce((s, r) => s + r.bhyt, 0);
    const totalBHtn = rows.reduce((s, r) => s + r.bhtn, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-violet-700 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white flex-shrink-0">
                        {sent ? <IcCheck /> : <IcSend />}
                        <IcSend />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">
                            {sent ? "Report Sent" : "Confirm Send Report"}
                        </h3>
                        <h3 className="text-base font-bold text-white">Confirm Send Report</h3>
                        <p className="text-xs text-white/70">{fmtPeriod(batch.period)} · {rows.length} employees</p>
                    </div>
                </div>

                {/* Summary */}
                <div className="px-6 py-5 space-y-3">
                    <p className="text-sm text-slate-600">The Personal Income Tax and Insurance report will be sent to the Finance - Accounting department:</p>
                {/* Body */}
                {!sent ? (
                    <>
                        {/* Summary */}
                        <div className="px-6 py-5 space-y-3">
                            <p className="text-sm text-slate-600">The Personal Income Tax and Insurance report will be sent to the Finance - Accounting department:</p>

                    <div className="rounded-xl bg-indigo-50 border border-indigo-100 divide-y divide-indigo-100">
                        {[
                            { label: "Total PIT", value: fmt(totalPIT), color: "text-indigo-700" },
                            { label: "Total Social Insurance (8%)", value: fmt(totalBHXH), color: "text-slate-700" },
                            { label: "Total Health Insurance (1.5%)", value: fmt(totalBHYT), color: "text-slate-700" },
                            { label: "Total Unemployment Insurance (1%)", value: fmt(totalBHtn), color: "text-slate-700" },
                            { label: "Total Insurances", value: fmt(totalIns), color: "text-violet-700 font-bold" },
                        ].map((r, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-2.5">
                                <span className="text-sm text-slate-600">{r.label}</span>
                                <span className={`text-sm font-semibold ${r.color}`}>{r.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <p className="text-xs text-amber-700">Once sent, the data will be transferred to the accounting system. Please review carefully before confirming.</p>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-white cursor-pointer">Cancel</button>
                    <button onClick={onSend}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 cursor-pointer shadow-sm">
                        <IcSend /> Confirm & Send
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Success Toast Notification ────────────────────────────────────────────────
const SuccessToast: React.FC<{ period: string; onClose: () => void }> = ({ period, onClose }) => (
    <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.3s_ease]">
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-white border border-emerald-200 shadow-xl shadow-emerald-100/50 max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <IcCheck />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">Report sent successfully!</p>
                <p className="text-xs text-slate-500 mt-0.5">The Tax &amp; Insurance report {period} has been sent to Finance - Accounting.</p>
                <div className="mt-2 h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full animate-[shrink_4s_linear]" style={{ width: "100%" }} />
                </div>
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={onClose} disabled={sending} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-white cursor-pointer disabled:opacity-50">Cancel</button>
                            <button onClick={onSend} disabled={sending}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 cursor-pointer shadow-sm disabled:opacity-75">
                                <span className={sending ? "animate-spin" : ""}>
                                    {sending ? <IcRefresh /> : <IcSend />}
                                </span>
                                {sending ? "Sending..." : "Confirm & Send"}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex flex-col items-center justify-center p-10 py-14 text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5 shadow-inner ring-4 ring-emerald-50">
                                <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Report Sent Successfully!</h3>
                            <p className="text-sm text-slate-500 max-w-[280px] leading-relaxed mx-auto">
                                The system has saved the status and notified the Finance department to proceed with the review.
                            </p>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-center">
                            <button onClick={onClose}
                                className="w-full sm:w-auto px-10 py-2.5 rounded-xl text-sm font-bold bg-slate-800 text-white hover:bg-slate-900 transition-all cursor-pointer shadow-sm">
                                Done
                            </button>
                        </div>
                    </>
                )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer mt-0.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
        </div>
    );
};


    </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN: Tax & Insurance Report Page
// ═══════════════════════════════════════════════════════════════════════════════
const TaxInsuranceReport: React.FC = () => {
    const [batches, setBatches] = useState<PayrollBatchDTO[]>([]);
    const [selId, setSelId] = useState("");
    const [batchLoad, setBatchLoad] = useState(true);
    const [rows, setRows] = useState<PayrollReviewDTO[]>([]);
    const [taxRows, setTaxRows] = useState<TaxInsuranceDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [sending, setSending] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [sentPeriods, setSentPeriods] = useState<Set<string>>(new Set());

    // Load batches
    const loadBatches = useCallback(async () => {
        setBatchLoad(true);
        try {
            const data = await getBatches();
            setBatches(data);
            if (data.length > 0) setSelId(id => id || data[0].batchId);
        } finally { setBatchLoad(false); }
    }, []);

    useEffect(() => { loadBatches(); }, []); // eslint-disable-line

    // Load review rows when batch changes
    useEffect(() => {
        if (!selId) return;
        setLoading(true);
        setTaxRows([]);
        getTaxInsuranceReport(selId)
            .then(setTaxRows)
            .catch(() => setTaxRows([]))
        setRows([]);
        getBatchDetailsForReview(selId)
            .then(setRows)
            .catch(() => setRows([]))
            .finally(() => setLoading(false));
    }, [selId]);

    const totalGross = taxRows.reduce((s, r) => s + (r.grossSalary ?? 0), 0);
    const totalPIT = taxRows.reduce((s, r) => s + (r.pit ?? 0), 0);
    const totalIns = taxRows.reduce((s, r) => s + (r.totalIns ?? 0), 0);
    const totalBHXH = taxRows.reduce((s, r) => s + (r.bhxh ?? 0), 0);
    const totalBHYT = taxRows.reduce((s, r) => s + (r.bhyt ?? 0), 0);
    const totalNet = taxRows.reduce((s, r) => s + (r.netSalary ?? 0), 0);
    // Build tax rows
    const taxRows: TaxRow[] = rows.map(r => {
        const gross = r.grossSalary ?? 0;
        const base = r.baseSalary ?? 0;
        const bhxh = base * BHXH_RATE;
        const bhyt = base * BHYT_RATE;
        const bhtn = base * BHTN_RATE;
        const totalIns = base * INS_RATE;
        const pit = calcPIT(gross);
        const totalDeduct = totalIns + pit;
        const net = Math.max(gross - totalDeduct, 0);
        return {
            name: r.employeeName, dept: r.department, gross, baseSalary: base,
            bhxh, bhyt, bhtn, totalIns, pit, totalDeduct, net
        };
    });

    const totalGross = taxRows.reduce((s, r) => s + r.gross, 0);
    const totalPIT = taxRows.reduce((s, r) => s + r.pit, 0);
    const totalIns = taxRows.reduce((s, r) => s + r.totalIns, 0);
    const totalBHXH = taxRows.reduce((s, r) => s + r.bhxh, 0);
    const totalBHYT = taxRows.reduce((s, r) => s + r.bhyt, 0);
    const totalNet = taxRows.reduce((s, r) => s + r.net, 0);
    const selBatch = batches.find(b => b.batchId === selId);
    const period = fmtPeriod(selBatch?.period);
    const alreadySent = sentPeriods.has(selId);

    const handleSend = async () => {
        setSending(true);
        try {
            await sendPayrollReport(selId);
            setSentPeriods(prev => new Set([...prev, selId]));
            loadBatches();
        } catch (error: any) {
            console.error("Failed to send report:", error);
            const errMsg = typeof error?.response?.data === 'string' ? error.response.data : error?.response?.data?.message || "Failed to send report";
            alert(errMsg);
        } finally {
            setSending(false);
        }
        setShowConfirm(false);
        await new Promise(r => setTimeout(r, 1200));
        setSending(false);
        setSentPeriods(prev => new Set([...prev, selId]));
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4500);
    };

    return (
        <div className="space-y-5">
            {/* ── Page Header ──────────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 p-6 shadow-lg">
                <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/10 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg flex-shrink-0"
                            style={{ boxShadow: "0 0 28px rgba(99,102,241,0.45)" }}>
                            <span className="text-white scale-125"><IcReport /></span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300/80">HR · Finance</span>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Tax &amp; Insurance Report</h1>
                            <p className="text-sm text-indigo-200/70 mt-0.5">Calculate PIT, Social, Health, and Unemployment Insurances for payroll</p>
                        </div>
                    </div>
                    {/* Sent badge */}
                    {alreadySent && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-sm font-semibold self-start sm:self-auto">
                            <IcCheck /> Report Sent
                        </div>
                    )}
                </div>
            </div>

            {/* ── Controls ─────────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="flex-1 w-full sm:max-w-xs">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Select Batch</label>
                    {batchLoad ? (
                        <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
                    ) : (
                        <div className="relative">
                            <select value={selId} onChange={e => { setSelId(e.target.value); }}
                                className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer">
                                {batches.map(b => (
                                    <option key={b.batchId} value={b.batchId}>
                                        {fmtPeriod(b.period)} — {b.status}
                                    </option>
                                ))}
                            </select>
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><IcChevron /></span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex-wrap sm:flex-nowrap">
                    <span className="font-semibold text-slate-700">Employee Deductions:</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">Social 8%</span>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">Health 1.5%</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Unemployment 1%</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">Progressive PIT</span>
                </div>
            </div>

            {/* ── Stat Cards ───────────────────────────────────────────────────── */}
            {taxRows.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Emp", value: taxRows.length + " emp.", icon: <IcUsers />, from: "from-blue-500", to: "to-indigo-600" },
                        { label: "Total Gross", value: fmt(totalGross), icon: <IcReport />, from: "from-violet-500", to: "to-purple-600" },
                        { label: "Total PIT", value: fmt(totalPIT), icon: <IcTax />, from: "from-rose-500", to: "to-pink-600" },
                        { label: "Total Ins (10.5%)", value: fmt(totalIns), icon: <IcShield />, from: "from-emerald-500", to: "to-teal-600" },
                    ].map((c, i) => (
                        <div key={i} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.from} ${c.to} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                                {c.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{c.label}</p>
                                <p className="text-xl font-bold text-slate-800 mt-0.5">{c.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Table ────────────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
                                <IcShield />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Employee Tax &amp; Insurance Details</h3>
                                {taxRows.length > 0 && <p className="text-xs text-slate-400">{taxRows.length} employees · {period}</p>}
                            </div>
                        </div>
                    </div>
                    {taxRows.length > 0 && (
                        <button onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                <path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
                            </svg>
                            Print
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-indigo-50/50">
                                {["No.", "Employee", "Department", "Gross Salary", "Base Salary (Ins)",
                                    "Social (8%)", "Health (1.5%)", "Unemp (1%)", "Total Ins (10.5%)", "PIT", "Net Salary"].map(h => (
                                        <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-indigo-600/70 text-left whitespace-nowrap">{h}</th>
                                    ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 11 }).map((__, j) => (
                                        <td key={j} className="px-4 py-4">
                                            <div className={`h-4 rounded bg-slate-100 animate-pulse ${j === 1 ? "w-28" : "w-20"}`} />
                                        </td>
                                    ))}</tr>
                                ))
                            ) : taxRows.length === 0 ? (
                                <tr><td colSpan={11} className="px-6 py-16 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
                                            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                                            <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-600">No data found in this batch</p>
                                    <p className="text-xs text-slate-400 mt-1">Please select a calculated batch or go to Payroll Management (HR) to calculate payroll.</p>
                                </td></tr>
                            ) : (
                                taxRows.map((r, idx) => (
                                    <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                                        <td className="px-4 py-3.5 text-slate-400 font-mono text-xs">{String(idx + 1).padStart(2, "0")}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                    {r.employeeName?.charAt(0).toUpperCase()}
                                                    {r.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-slate-800 whitespace-nowrap">{r.name}</span>
                                                <span className="font-semibold text-slate-800 whitespace-nowrap">{r.employeeName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{r.department || "—"}</td>
                                        <td className="px-4 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{fmt(r.grossSalary)}</td>
                                        <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{r.dept || "—"}</td>
                                        <td className="px-4 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{fmt(r.gross)}</td>
                                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{fmt(r.baseSalary)}</td>
                                        <td className="px-4 py-3.5 text-blue-700 whitespace-nowrap">-{fmt(r.bhxh)}</td>
                                        <td className="px-4 py-3.5 text-green-700 whitespace-nowrap">-{fmt(r.bhyt)}</td>
                                        <td className="px-4 py-3.5 text-amber-700 whitespace-nowrap">-{fmt(r.bhtn)}</td>
                                        <td className="px-4 py-3.5 font-semibold text-emerald-700 whitespace-nowrap">-{fmt(r.totalIns)}</td>
                                        <td className="px-4 py-3.5 font-semibold text-rose-600 whitespace-nowrap">-{fmt(r.pit)}</td>
                                        <td className="px-4 py-3.5">
                                            <span className="font-bold text-violet-700 whitespace-nowrap">{fmt(r.netSalary)}</span>
                                            <span className="font-bold text-violet-700 whitespace-nowrap">{fmt(r.net)}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {taxRows.length > 0 && (
                            <tfoot>
                                <tr className="border-t-2 border-indigo-100 bg-indigo-50/60">
                                    <td colSpan={3} className="px-4 py-3 text-xs font-bold text-indigo-700 uppercase tracking-wide">Total</td>
                                    <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{fmt(totalGross)}</td>
                                    <td className="px-4 py-3" />
                                    <td className="px-4 py-3 font-bold text-blue-700 whitespace-nowrap">-{fmt(totalBHXH)}</td>
                                    <td className="px-4 py-3 font-bold text-green-700 whitespace-nowrap">-{fmt(totalBHYT)}</td>
                                    <td className="px-4 py-3 font-bold text-amber-700 whitespace-nowrap">-{fmt(taxRows.reduce((s, r) => s + r.bhtn, 0))}</td>
                                    <td className="px-4 py-3 font-bold text-emerald-700 whitespace-nowrap">-{fmt(totalIns)}</td>
                                    <td className="px-4 py-3 font-bold text-rose-600 whitespace-nowrap">-{fmt(totalPIT)}</td>
                                    <td className="px-4 py-3 font-bold text-violet-700 text-base whitespace-nowrap">{fmt(totalNet)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* ── Footer action buttons ─────────────────────────────────────── */}
                {taxRows.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="text-sm text-slate-500">
                            Total Deductions: <span className="font-bold text-rose-600">{fmt(totalPIT + totalIns)}</span>
                            <span className="text-slate-300 mx-2">·</span>
                            Net Salary: <span className="font-bold text-violet-700">{fmt(totalNet)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {alreadySent ? (
                                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                                    <IcCheck /> Sent Report {period}
                                </div>
                            ) : (
                                <>
                                    <button onClick={() => window.print()}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                            <path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
                                        </svg>
                                        Print
                                    </button>
                                    <button onClick={() => setShowConfirm(true)} disabled={sending}
                                        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${sending
                                            ? "bg-indigo-400 text-white cursor-wait"
                                            : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 cursor-pointer"
                                            }`}>
                                        <span className={sending ? "animate-spin" : ""}>{sending ? <IcRefresh /> : <IcSend />}</span>
                                        {sending ? "Sending..." : "Send Report"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showConfirm && selBatch && (
                <ConfirmModal batch={selBatch} rows={taxRows} onSend={handleSend} onClose={() => setShowConfirm(false)} />
                <ConfirmModal batch={selBatch} rows={taxRows} onSend={handleSend} onClose={() => setShowConfirm(false)} sending={sending} sent={sentPeriods.has(selBatch.batchId)} />
            )}
            {showToast && <SuccessToast period={period} onClose={() => setShowToast(false)} />}
        </div>
    );
};

export default TaxInsuranceReport;
