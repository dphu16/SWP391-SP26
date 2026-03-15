import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "./PayrollModule";
import {
    getAllPeriods, getTaxReportByBatch, createPaymentRequest, getActiveFinanceAccounts, getMyPaymentRequests,
    type TaxReportResponse, type PayrollPeriodResponse
} from "../../services/payrollService";

const fmt = (n?: number | null) =>
    n == null ? "0 ₫" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const TaxInsuranceReport: React.FC = () => {
    const [periods, setPeriods] = useState<PayrollPeriodResponse[]>([]);
    const [selPeriodId, setSelPeriodId] = useState("");
    const [periodLoad, setPeriodLoad] = useState(true);

    const [report, setReport] = useState<TaxReportResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    // Track which batchIds have already had TAX report sent (prevent duplicate)
    const [sentBatches, setSentBatches] = useState<Set<string>>(new Set());

    const loadData = useCallback(async () => {
        try {
            const [data, myReqs] = await Promise.all([
                getAllPeriods(),
                getMyPaymentRequests()
            ]);

            const sentBatchIds = new Set<string>();
            myReqs.forEach(req => {
                if (req.type === "TAX_INSURANCE" && req.payrollBatchId) {
                    sentBatchIds.add(req.payrollBatchId);
                }
            });
            setSentBatches(sentBatchIds);

            const sorted = [...data].sort((a, b) => b.year - a.year || b.month - a.month);
            setPeriods(sorted);
            if (sorted.length > 0 && !selPeriodId) setSelPeriodId(sorted[0].periodId);
        } catch {
            setError("Lỗi khi tải dữ liệu ban đầu.");
        } finally {
            setPeriodLoad(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const selPeriod = periods.find(p => p.periodId === selPeriodId);
    const batchId = selPeriod?.batchId;
    const batchStatus = selPeriod?.batchStatus;

    // Allow sending tax report when batch is PROCESSED (salary report already sent)
    // or when LOCKED (final state). NOT on DRAFT/VALIDATED.
    const canSendTax = (batchStatus === "PROCESSED" || batchStatus === "LOCKED") && !!(batchId);
    const alreadySent = batchId ? sentBatches.has(batchId) : false;

    const handleLoadReport = async () => {
        if (!batchId) {
            setError("This payroll period has no batch yet.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await getTaxReportByBatch(batchId);
            setReport(data);
            if (data.length === 0) setError("No payslips found or salary not yet calculated.");
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            setError(err.response?.data?.message || "Failed to load report from server.");
            setReport([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReport = async () => {
        if (!batchId || alreadySent) return;
        setLoading(true); setError(null); setSuccessMsg(null);
        try {
            const accs = await getActiveFinanceAccounts();
            if (!accs || accs.length === 0) throw new Error("No ACTIVE finance account found.");
            await createPaymentRequest({
                payrollBatchId: batchId,
                hrNote: `Tax & Insurance declaration for period ${selPeriod?.month}/${selPeriod?.year}`,
                type: "TAX_INSURANCE",
                sourceAccountId: accs[0].accountId
            });
            setSentBatches(prev => new Set(prev).add(batchId));
            setSuccessMsg(`Tax & Insurance declaration for ${selPeriod?.month}/${selPeriod?.year} sent to Finance successfully!`);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            const msg = err.response?.data?.message || (e as Error).message || "Failed to send report to server.";
            setError(msg);
            if (msg.includes("đã được gửi") || msg.includes("trùng lặp")) {
                setSentBatches(prev => new Set(prev).add(batchId));
            }
        } finally {
            setLoading(false);
        }
    };

    const totalGross = report.reduce((s, r) => s + r.grossSalary, 0);
    const totalTax = report.reduce((s, r) => s + r.taxAmount, 0);
    const totalIns = report.reduce((s, r) => s + r.insuranceAmount, 0);
    const totalNet = report.reduce((s, r) => s + r.netSalary, 0);

    const BATCH_STATUS_CFG: Record<string, { text: string; bg: string; border: string; dot: string }> = {
        LOCKED: { text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-500" },
        PROCESSED: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
        VALIDATED: { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
        DRAFT: { text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400" },
    };

    return (
        <div className="py-4 px-4 space-y-6">

            {/* ── Control panel ── */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm mb-6 print:hidden">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    {/* Period selector + Batch info */}
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-[#374151] mb-2">Select Payroll Period</label>
                        {periodLoad ? (
                            <div className="h-10 rounded-xl bg-[#f1f5f9] animate-pulse w-full max-w-sm" />
                        ) : periods.length === 0 ? (
                            <p className="text-sm text-[#94a3b8] italic">No payroll periods found.</p>
                        ) : (
                            <>
                                <div className="relative max-w-sm">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">{Icon.calendar}</span>
                                    <select value={selPeriodId}
                                        onChange={e => { setSelPeriodId(e.target.value); setReport([]); setError(null); setSuccessMsg(null); }}
                                        className="w-full pl-9 pr-9 py-3 rounded-xl appearance-none border border-[#e2e8f0] bg-white text-sm font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#10b981]/30 focus:border-[#10b981] transition-all cursor-pointer">
                                        {periods.map(p => (
                                            <option key={p.periodId} value={p.periodId}>
                                                Month {String(p.month).padStart(2, "0")}/{p.year} — {p.status}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">{Icon.chevronDown}</span>
                                </div>

                                {/* Batch ID + status badge — displayed below selector */}
                                {selPeriod && (
                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                        <span className="text-xs text-[#64748b] font-medium tracking-wide">Batch ID:</span>
                                        <span className="font-mono text-xs text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-lg select-all">
                                            {batchId ?? <span className="text-rose-400 italic">No batch yet</span>}
                                        </span>
                                        {batchStatus && (() => {
                                            const cfg = BATCH_STATUS_CFG[batchStatus] ?? BATCH_STATUS_CFG.DRAFT;
                                            return (
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${cfg.text} ${cfg.bg} ${cfg.border}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                    {batchStatus}
                                                </span>
                                            );
                                        })()}
                                        {canSendTax && (
                                            <span className="text-[11px] text-[#10b981] font-semibold">✓ Eligible to send declaration</span>
                                        )}
                                        {!canSendTax && batchStatus && (
                                            <span className="text-[11px] text-[#b45309] font-semibold italic">Salary report must be sent first</span>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={handleLoadReport} disabled={loading || !batchId}
                            className="relative group overflow-hidden bg-white border border-[#e2e8f0] text-[#0f172a] px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-[#f8fafc] disabled:opacity-50 cursor-pointer transition-all">
                            {loading ? "Loading..." : "Load Report"}
                        </button>
                        {report.length > 0 && !loading && (
                            <button onClick={handleSendReport}
                                disabled={!canSendTax || alreadySent}
                                className="relative group overflow-hidden bg-[#10b981] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgb(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgb(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                                title={alreadySent ? "Already sent for this batch" : !canSendTax ? "Salary report (SALARY) must be sent first" : ""}>
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                                {Icon.money}
                                {alreadySent ? "Already Sent" : "Send to Finance"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mt-4 p-4 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-sm font-medium flex items-center gap-3">
                        {Icon.warning} <span className="flex-1">{error}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="mt-4 p-4 rounded-xl bg-[#f0fdf4] border border-[#10b981] text-[#059669] text-sm font-medium flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="flex-1">{successMsg}</span>
                    </div>
                )}
            </div>

            {/* ── Report table ── */}
            {!loading && report.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden animate-fade-in">
                    {/* Table header */}
                    <div className="p-5 border-b border-[#f1f5f9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Report — Month {selPeriod?.month}/{selPeriod?.year}
                            </h3>
                            <p className="text-sm font-medium text-[#64748b] mt-1 ml-7">
                                {report.length} employees
                            </p>
                        </div>
                        {/* KPI pills */}
                        <div className="flex gap-2 flex-wrap text-right">
                            <div className="px-4 py-2 rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
                                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Tax (PIT)</p>
                                <p className="text-sm font-extrabold text-rose-600">{fmt(totalTax)}</p>
                            </div>
                            <div className="px-4 py-2 rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
                                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Insurance</p>
                                <p className="text-sm font-extrabold text-indigo-600">{fmt(totalIns)}</p>
                            </div>
                            <div className="px-4 py-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] shadow-sm">
                                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Net Total</p>
                                <p className="text-sm font-extrabold text-[#10b981]">{fmt(totalNet)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#e2e8f0]">
                                    <th className="px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Employee</th>
                                    <th className="px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Dept / Position</th>
                                    <th className="px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Gross</th>
                                    <th className="px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Insurance (10.5%)</th>
                                    <th className="px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Tax (PIT)</th>
                                    <th className="px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Net Salary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.map(r => (
                                    <tr key={r.employeeId} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                                        {/* Employee */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-3 text-left min-w-[180px]">
                                                <div className="w-9 h-9 rounded-xl bg-[#e6faf3] flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-4 h-4 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-[#0f172a] text-[13px]">{r.employeeName}</div>
                                                    <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5">{r.employeeCode}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Dept */}
                                        <td className="px-5 py-4 text-center">
                                            <div className="font-medium text-[#334155] text-[13px]">{r.department || "—"}</div>
                                            <div className="text-xs text-[#94a3b8] mt-0.5">{r.position || "—"}</div>
                                        </td>
                                        {/* Gross */}
                                        <td className="px-5 py-4 text-center font-semibold text-[#0f172a] tabular-nums text-[13px]">{fmt(r.grossSalary)}</td>
                                        {/* Insurance */}
                                        <td className="px-5 py-4 text-center tabular-nums">
                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                −{fmt(r.insuranceAmount)}
                                            </span>
                                        </td>
                                        {/* Tax */}
                                        <td className="px-5 py-4 text-center tabular-nums">
                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                                −{fmt(r.taxAmount)}
                                            </span>
                                        </td>
                                        {/* Net */}
                                        <td className="px-5 py-4 text-center tabular-nums">
                                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                {fmt(r.netSalary)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-[#e2e8f0] bg-[#f8fafc]">
                                    <td colSpan={2} className="px-5 py-3.5 text-center text-xs font-black text-[#0f172a] uppercase tracking-widest">Total</td>
                                    <td className="px-5 py-3.5 text-center font-extrabold text-[#0f172a] tabular-nums text-[13px]">{fmt(totalGross)}</td>
                                    <td className="px-5 py-3.5 text-center font-extrabold text-indigo-600 tabular-nums text-[13px]">−{fmt(totalIns)}</td>
                                    <td className="px-5 py-3.5 text-center font-extrabold text-rose-600 tabular-nums text-[13px]">−{fmt(totalTax)}</td>
                                    <td className="px-5 py-3.5 text-center font-extrabold text-[#10b981] tabular-nums text-[13px]">{fmt(totalNet)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaxInsuranceReport;