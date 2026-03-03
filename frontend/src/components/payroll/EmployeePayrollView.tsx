import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "./PayrollModule";
import {
    getMyPayslips, getPayslipDetail, createInquiry, getMyInquiries, downloadPayslipPdf,
    type PayslipSummaryDTO, type PayslipDetailDTO, type InquiryResponseDTO,
} from "../../services/payrollService";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n?: number | null) =>
    n == null ? "0 ₫" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "—";

// ─── Status configs ────────────────────────────────────────────────────────────
const PAYSLIP_STATUS: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
    DRAFT: { label: "Draft", dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
    CONFIRMED: { label: "Confirmed", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    PAID: { label: "Paid", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    CANCELLED: { label: "Cancelled", dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
};

const INQUIRY_STATUS: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
    OPEN: { label: "Open", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    IN_PROGRESS: { label: "In Progress", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    RESOLVED: { label: "Resolved", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    REJECTED: { label: "Rejected", dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
};

// ─── Badge ─────────────────────────────────────────────────────────────────────
const Badge: React.FC<{ status: string; cfg: typeof PAYSLIP_STATUS }> = ({ status, cfg }) => {
    const c = cfg[status] ?? cfg[Object.keys(cfg)[0]];
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.text} ${c.bg} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = () => (
    <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">{[0, 1, 2].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
        <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
    </div>
);

// ─── Inquiry Modal ─────────────────────────────────────────────────────────────
const InquiryModal: React.FC<{ payslipId?: string | null; onClose: () => void; onDone: () => void }> = ({ payslipId, onClose, onDone }) => {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const submit = async () => {
        if (!subject.trim() || !message.trim()) { setErr("Please enter both subject and message."); return; }
        setBusy(true); setErr("");
        try {
            await createInquiry({ payslipId: payslipId ?? null, subject: subject.trim(), message: message.trim() });
            onDone(); onClose();
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "Failed to submit. Please try again.");
        } finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <span className="text-white">{Icon.help}</span>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Send Payroll Inquiry</h3>
                            <p className="text-xs text-slate-500">HR will respond within 1-2 business days</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">{Icon.close}</button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {err && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
                            {Icon.warning} {err}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Subject <span className="text-rose-500">*</span></label>
                        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g.: Incorrect OT hours in January..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Message <span className="text-rose-500">*</span></label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                            placeholder="Detailed description..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors resize-none" />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} disabled={busy} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-white transition-colors cursor-pointer disabled:opacity-50">Cancel</button>
                    <button onClick={submit} disabled={busy}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer disabled:opacity-60">
                        {busy ? "Submitting..." : "Submit Inquiry"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const EmployeePayrollView: React.FC = () => {
    const [list, setList] = useState<PayslipSummaryDTO[]>([]);
    const [selId, setSelId] = useState<string | null>(null);
    const [detail, setDetail] = useState<PayslipDetailDTO | null>(null);
    const [inquiries, setInqList] = useState<InquiryResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDL] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<"payslip" | "inquiries">("payslip");
    const [showModal, setShowModal] = useState(false);
    const [pdfBusy, setPdfBusy] = useState(false);

    // Load payslip list
    const loadList = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const page = await getMyPayslips(0, 50);
            setList(page.content);
            if (page.content.length > 0) setSelId(page.content[0].payslipId);
        } catch (e: any) {
            const status = e?.response?.status;
            setError(
                status === 401 ? "Session expired. Please log in again." :
                    status === 403 ? "You do not have permission to view payroll data." :
                        `Data loading error (${status ?? "network"}): ${e?.response?.data?.message ?? e?.message ?? "Unknown"}`
            );
        } finally { setLoading(false); }
    }, []);

    // Load inquiries
    const loadInquiries = useCallback(async () => {
        try {
            const page = await getMyInquiries(0, 50);
            setInqList(page.content);
        } catch { /* silent */ }
    }, []);

    // Load detail
    const loadDetail = useCallback(async (id: string) => {
        setDL(true);
        try {
            const d = await getPayslipDetail(id);
            setDetail(d);
        } catch { setDetail(null); }
        finally { setDL(false); }
    }, []);

    useEffect(() => { loadList(); loadInquiries(); }, [loadList, loadInquiries]);
    useEffect(() => { if (selId) loadDetail(selId); }, [selId, loadDetail]);

    const downloadPdf = async () => {
        if (!selId || !detail || pdfBusy) return;
        setPdfBusy(true);
        try {
            const blob = await downloadPayslipPdf(selId);
            const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
            const a = document.createElement("a");
            a.href = url; a.download = `Payslip_M${detail.month}_${detail.year}.pdf`;
            document.body.appendChild(a); a.click(); a.remove();
        } catch { alert("Failed to download PDF."); }
        finally { setPdfBusy(false); }
    };

    const incomeItems = detail?.items?.filter(i => i.type === "INCOME") ?? [];
    const deductItems = detail?.items?.filter(i => i.type === "DEDUCTION") ?? [];
    const grossSalary = detail?.grossSalary ?? 0;
    const netSalary = detail?.netSalary ?? 0;
    const totalDeduct = detail?.totalDeductions ?? 0;
    const netPct = grossSalary > 0 ? Math.round((netSalary / grossSalary) * 100) : 0;
    const deductPct = grossSalary > 0 ? Math.round((totalDeduct / grossSalary) * 100) : 0;

    // ── Render states ─────────────────────────────────────────────────────────────
    if (loading) return <Skeleton />;

    if (error) return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mb-4">
                <span className="text-rose-500 scale-125">{Icon.warning}</span>
            </div>
            <h3 className="text-lg font-bold text-rose-700 mb-2">Failed to load data</h3>
            <p className="text-sm text-rose-600 max-w-md mb-5">{error}</p>
            <button onClick={loadList} className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 cursor-pointer">
                Retry
            </button>
        </div>
    );

    if (list.length === 0) return (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-5 text-slate-300">
                {Icon.inbox}
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">No Payslips Yet</h3>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                Payslips will appear here once HR completes calculation and approval for a period.
            </p>
        </div>
    );

    return (
        <>
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-5">
                {(["payslip", "inquiries"] as const).map(t => (
                    <button key={t} onClick={() => { setTab(t); if (t === "inquiries") loadInquiries(); }}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${tab === t ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}>
                        {t === "payslip" ? <>{Icon.wallet} Payslip</> : <>{Icon.help} Inquiries{inquiries.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">{inquiries.length}</span>}</>}
                    </button>
                ))}
            </div>

            {tab === "payslip" ? (
                <>
                    {/* ── Period + actions bar ─────────────────────────────────────── */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 mb-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-slate-400">{Icon.calendar}</span>
                                <label htmlFor="period-select" className="text-sm font-semibold text-slate-700">Payroll Period:</label>
                                <div className="relative">
                                    <select id="period-select" value={selId ?? ""} onChange={e => setSelId(e.target.value)}
                                        className="appearance-none pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer min-w-[220px] hover:border-emerald-300 transition-colors">
                                        {list.map(p => (
                                            <option key={p.payslipId} value={p.payslipId}>Month {p.period} — {fmt(p.netSalary)}</option>
                                        ))}
                                    </select>
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">{Icon.chevronDown}</span>
                                </div>
                                {detail && <Badge status={detail.status} cfg={PAYSLIP_STATUS} />}
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={downloadPdf} disabled={pdfBusy}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-60">
                                    {Icon.download}<span className="hidden sm:inline">{pdfBusy ? "Downloading..." : "Download PDF"}</span>
                                </button>
                                <button onClick={() => window.print()}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">
                                    {Icon.print}<span className="hidden sm:inline">Print</span>
                                </button>
                                <button onClick={() => setShowModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer shadow-sm">
                                    {Icon.help}<span className="hidden sm:inline">Inquiry</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Payslip Detail ───────────────────────────────────────────── */}
                    {detailLoading ? <Skeleton /> : detail ? (
                        <div className="space-y-5">
                            {/* Stat cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Gross */}
                                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Gross Salary</p>
                                            <p className="text-2xl font-bold text-slate-800">{fmt(detail.grossSalary)}</p>
                                        </div>
                                        <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-emerald-600">{Icon.wallet}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400">Gross (Before deductions)</p>
                                </div>

                                {/* Deductions */}
                                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Deductions</p>
                                            <p className="text-2xl font-bold text-rose-600">-{fmt(detail.totalDeductions)}</p>
                                        </div>
                                        <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-rose-500">{Icon.shield}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-slate-400">PIT Tax: <span className="font-medium text-slate-600">{fmt(detail.taxAmount)}</span></p>
                                        <p className="text-xs text-slate-400">Insurance: <span className="font-medium text-slate-600">{fmt(detail.insuranceAmount)}</span></p>
                                    </div>
                                </div>

                                {/* Net */}
                                <div className="rounded-2xl border-2 border-emerald-400/30 bg-gradient-to-br from-emerald-50 to-slate-50 shadow-sm p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 mb-1">Net Salary</p>
                                            <p className="text-2xl font-bold text-emerald-600">{fmt(detail.netSalary)}</p>
                                        </div>
                                        <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <span className="text-white">{Icon.checkCircle}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-emerald-700/70">
                                        {detail.paidAt ? `Paid At: ${fmtDate(detail.paidAt)}` : "Not Paid"}
                                    </p>
                                </div>
                            </div>

                            {/* Salary distribution bar */}
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                                <div className="flex justify-between text-xs text-slate-500 mb-2">
                                    <span>Salary Breakdown</span>
                                    <span>{netPct}% Net</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                                    <div className="h-full bg-emerald-400 rounded-l-full transition-all duration-700" style={{ width: `${netPct}%` }} />
                                    <div className="h-full bg-rose-300 transition-all duration-700" style={{ width: `${deductPct}%` }} />
                                </div>
                                <div className="flex gap-4 mt-2 text-xs text-slate-400">
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Net Pay</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-300" />Deduction</span>
                                </div>
                            </div>

                            {/* Detail table */}
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">Payslip Details</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Month {detail.month}/{detail.year}
                                            {detail.startDate && ` · ${fmtDate(detail.startDate)} – ${fmtDate(detail.endDate)}`}
                                        </p>
                                    </div>
                                    <Badge status={detail.status} cfg={PAYSLIP_STATUS} />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Item</th>
                                                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount (VNĐ)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {/* Income section */}
                                            <tr className="bg-emerald-50/60">
                                                <td colSpan={2} className="px-6 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Income</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-3.5 font-medium text-slate-700">Base Salary</td>
                                                <td className="px-6 py-3.5 text-right font-semibold text-emerald-600">+{fmt(detail.baseSalary)}</td>
                                            </tr>
                                            {detail.totalAllowances > 0 && (
                                                <tr className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3.5 font-medium text-slate-700">Allowances</td>
                                                    <td className="px-6 py-3.5 text-right font-semibold text-emerald-600">+{fmt(detail.totalAllowances)}</td>
                                                </tr>
                                            )}
                                            {incomeItems.map((item, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3.5 text-slate-600 pl-10">↳ {item.itemName}</td>
                                                    <td className="px-6 py-3.5 text-right text-emerald-600">+{fmt(item.amount)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-emerald-50 border-t border-emerald-100">
                                                <td className="px-6 py-3 text-xs font-bold text-emerald-800">Total Income (Gross)</td>
                                                <td className="px-6 py-3 text-right font-bold text-emerald-800">{fmt(detail.grossSalary)}</td>
                                            </tr>

                                            {/* Deduction section */}
                                            <tr className="bg-rose-50/60">
                                                <td colSpan={2} className="px-6 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                                                        <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Deductions</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-3.5 font-medium text-slate-700">PIT Tax</td>
                                                <td className="px-6 py-3.5 text-right font-semibold text-rose-600">-{fmt(detail.taxAmount)}</td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-3.5 font-medium text-slate-700">Insurances (SI + HI + UI — 10.5%)</td>
                                                <td className="px-6 py-3.5 text-right font-semibold text-rose-600">-{fmt(detail.insuranceAmount)}</td>
                                            </tr>
                                            {deductItems.map((item, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3.5 text-slate-600 pl-10">↳ {item.itemName}</td>
                                                    <td className="px-6 py-3.5 text-right text-rose-600">-{fmt(item.amount)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-rose-50 border-t border-rose-100">
                                                <td className="px-6 py-3 text-xs font-bold text-rose-800">Total Deductions</td>
                                                <td className="px-6 py-3 text-right font-bold text-rose-800">-{fmt(detail.totalDeductions)}</td>
                                            </tr>

                                            {/* Net */}
                                            <tr className="bg-gradient-to-r from-emerald-50 to-slate-50 border-t-2 border-emerald-200">
                                                <td className="px-6 py-5">
                                                    <p className="text-sm font-bold text-slate-800">NET PAY</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{detail.paidAt ? `Paid Date: ${fmtDate(detail.paidAt)}` : "Not Paid"}</p>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <p className="text-xl font-bold text-emerald-600">{fmt(detail.netSalary)}</p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Inquiry History</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{inquiries.length} submitted</p>
                        </div>
                        <button onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 cursor-pointer">
                            {Icon.help} New Inquiry
                        </button>
                    </div>

                    {inquiries.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">{Icon.inbox}</div>
                            <p className="text-sm font-semibold text-slate-600">No Inquiries Found</p>
                            <p className="text-xs text-slate-400 mt-1">You haven't submitted any payroll inquiries.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {inquiries.map(inq => (
                                <div key={inq.id} className="px-6 py-4 hover:bg-slate-50/60 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{inq.subject}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{inq.message}</p>
                                            {inq.payslipPeriod && (
                                                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">{Icon.calendar} Period: {inq.payslipPeriod}</p>
                                            )}
                                            {inq.hrResponse && (
                                                <div className="mt-3 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-0.5">HR Response:</p>
                                                    <p className="text-xs text-slate-700">{inq.hrResponse}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <Badge status={inq.status} cfg={INQUIRY_STATUS} />
                                            <span className="text-[10px] text-slate-400">{new Date(inq.createdAt).toLocaleDateString("vi-VN")}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <InquiryModal payslipId={selId} onClose={() => setShowModal(false)} onDone={loadInquiries} />
            )}
        </>
    );
};

export default EmployeePayrollView;
