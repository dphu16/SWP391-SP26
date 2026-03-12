import React, { useState, useEffect, useCallback } from "react";
import { Icon, fmt, getErrMsg, Badge } from "./PayrollModule";
import {
    getFinancePendingRequests, reviewPaymentRequest,
    getFinanceBatchPayslips, getFinanceTaxReport, downloadPaymentReport,
    type PaymentRequestResponse, type ReviewPaymentRequestRequest,
    type PayslipResponse, type TaxReportResponse
} from "../../services/payrollService";

const REQUEST_STATUS: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
    PENDING:  { label: "Pending",  dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
    APPROVED: { label: "Approved", dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
    PAID:     { label: "Paid",     dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    REJECTED: { label: "Rejected", dot: "bg-rose-500",    text: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200" },
};

const REQUEST_TYPE: Record<string, { label: string; text: string; bg: string; border: string }> = {
    SALARY:        { label: "Salary Payment",    text: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200" },
    TAX_INSURANCE: { label: "Tax & Insurance",   text: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
};

// ─── Review Modal ─────────────────────────────────────────────────────────────
const ReviewModal: React.FC<{
    request: PaymentRequestResponse;
    mode: "approve" | "reject";
    onSuccess: () => void;
    onClose: () => void;
}> = ({ request, mode, onSuccess, onClose }) => {
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const isApprove = mode === "approve";

    const submit = async () => {
        if (!isApprove && !note.trim()) { setErr("Please enter a rejection reason."); return; }
        setBusy(true); setErr("");
        try {
            const body: ReviewPaymentRequestRequest = { approved: isApprove, financeNote: note.trim() || undefined };
            await reviewPaymentRequest(request.requestId, body);
            onSuccess();
            onClose();
        } catch (e) { setErr(getErrMsg(e)); }
        finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#e2e8f0]">
                <div className={`px-6 py-5 border-b border-[#f1f5f9] flex items-center gap-4 ${isApprove ? "bg-emerald-50/50" : "bg-rose-50/50"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isApprove ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"} flex-shrink-0`}>
                        {isApprove ? Icon.checkCircle : Icon.close}
                    </div>
                    <div>
                        <h3 className="text-[15px] font-bold text-[#0f172a]">
                            {isApprove ? (request.type === "SALARY" ? "Approve salary payment?" : "Approve Tax & Insurance payment?") : "Reject this request?"}
                        </h3>
                        <p className="text-[12px] text-[#64748b] mt-0.5">Amount: <strong className="text-[#0f172a]">{fmt(request.totalAmountRequested)}</strong></p>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    {err && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-sm font-medium">{err}</div>}
                    <div>
                        <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-2">
                            {isApprove ? "Finance note (optional)" : "Rejection reason (required)"}
                        </label>
                        <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                            placeholder={isApprove ? "Add a note if needed..." : "Enter rejection reason..."}
                            className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 bg-white shadow-sm placeholder:text-slate-400" />
                    </div>
                </div>
                <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#f1f5f9] flex justify-end gap-3">
                    <button onClick={onClose} 
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-colors cursor-pointer">
                        Cancel
                    </button>
                    <button onClick={submit} disabled={busy}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50 shadow-sm border ${
                            isApprove ? "bg-[#10b981] hover:bg-[#059669] border-[#059669]" : "bg-rose-500 hover:bg-rose-600 border-rose-600"
                        }`}>
                        {busy ? "Processing..." : isApprove ? "Confirm Approval" : "Reject Request"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Finance View ────────────────────────────────────────────────────────
const ReportDetailModal: React.FC<{
    request: PaymentRequestResponse;
    onClose: () => void;
}> = ({ request, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [payslips, setPayslips] = useState<PayslipResponse[]>([]);
    const [taxReports, setTaxReports] = useState<TaxReportResponse[]>([]);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                if (request.type === "SALARY") {
                    const data = await getFinanceBatchPayslips(request.payrollBatchId);
                    setPayslips(data);
                } else {
                    const data = await getFinanceTaxReport(request.payrollBatchId);
                    setTaxReports(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [request]);

    const handleDownload = async () => {
        try {
            const blob = await downloadPaymentReport(request.requestId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Payment_Report_${request.requestId.substring(0, 8)}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (e) {
            alert(getErrMsg(e));
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-5 border-b border-[#f1f5f9] flex items-center justify-between bg-[#f8fafc]">
                    <div>
                        <h3 className="text-lg font-bold text-[#0f172a]">
                            {request.type === "SALARY" ? "Salary Payment Details" : "Tax & Insurance Details"}
                        </h3>
                        <p className="text-xs text-[#64748b] mt-1 font-mono">
                            Batch: {request.payrollBatchId} | Request: {request.requestId.substring(0, 8)}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleDownload}
                            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-2">
                            {Icon.download} Download PDF
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                            {Icon.close}
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#e2e8f0]">
                                        <th className="px-4 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Emp ID</th>
                                        <th className="px-4 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Full Name</th>
                                        {request.type === "SALARY" ? (
                                            <>
                                                <th className="px-4 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Bank</th>
                                                <th className="px-4 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Account No.</th>
                                                <th className="px-4 py-3 text-center text-[11px] font-bold text-[#0f172a] uppercase tracking-widest">Net Salary</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-4 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Gross Salary</th>
                                                <th className="px-4 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Insurance</th>
                                                <th className="px-4 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Tax (PIT)</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f1f5f9]">
                                    {request.type === "SALARY" && payslips.map(p => (
                                        <tr key={p.payslipId} className="border-b border-[#f1f5f9] hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-[11px] text-slate-400 text-center">#{p.employeeId.substring(0, 8)}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-3 text-left">
                                                    <div className="w-8 h-8 rounded-xl bg-[#e6faf3] flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-4 h-4 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <div className="font-semibold text-slate-800 text-[13px]">{p.employeeName}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-300 text-[11px] text-center font-medium">—</td>
                                            <td className="px-4 py-3 text-slate-300 text-[11px] text-center font-medium">—</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[13px] tabular-nums">
                                                    {fmt(p.netSalary)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {request.type === "TAX_INSURANCE" && taxReports.map(r => (
                                        <tr key={r.employeeId} className="border-b border-[#f1f5f9] hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-[11px] text-slate-400 text-center">#{r.employeeId.substring(0, 8)}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-3 text-left">
                                                    <div className="w-8 h-8 rounded-xl bg-[#e6faf3] flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-4 h-4 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <div className="font-semibold text-slate-800 text-[13px]">{r.employeeName}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-slate-800 text-[13px] tabular-nums">{fmt(r.grossSalary)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-600 border border-sky-100">
                                                    {fmt(r.insuranceAmount)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                                    {fmt(r.taxAmount)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Main Finance View ────────────────────────────────────────────────────────
const FinancePayrollView: React.FC = () => {
    const [requests, setRequests] = useState<PaymentRequestResponse[]>([]);
    const [reqLoad, setReqLoad] = useState(true);
    const [approveItem, setApproveItem] = useState<PaymentRequestResponse | null>(null);
    const [rejectItem, setRejectItem]   = useState<PaymentRequestResponse | null>(null);
    const [viewDetailItem, setViewDetailItem] = useState<PaymentRequestResponse | null>(null);

    const loadRequests = useCallback(async () => {
        setReqLoad(true);
        try {
            const data = await getFinancePendingRequests();
            setRequests(data);
        } catch (e) { console.error(e); }
        finally { setReqLoad(false); }
    }, []);

    useEffect(() => { loadRequests(); }, [loadRequests]);

    const pending         = requests.filter(r => r.status === "PENDING").length;
    const approved        = requests.filter(r => r.status === "APPROVED" || r.status === "PAID").length;
    const totalPendingAmt = requests.filter(r => r.status === "PENDING").reduce((s, r) => s + (r.totalAmountRequested ?? 0), 0);

    return (
        <div className="py-4 px-4 space-y-6">
            {/* Stats + refresh row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs font-bold text-amber-700">{pending} pending</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-emerald-700">{approved} processed</span>
                    </div>
                </div>
                <button onClick={loadRequests}
                    className="p-2 rounded-xl border border-[#e2e8f0] bg-white text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] shadow-sm transition-all cursor-pointer">
                    {Icon.refresh}
                </button>
            </div>

            {/* Pending amount alert — only if there are pending */}
            {pending > 0 && (
                <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#fffbeb] border border-[#fde68a] shadow-sm">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-amber-800">{pending} request(s) awaiting review</span>
                    </div>
                    <span className="text-[15px] font-black text-amber-900 bg-amber-100/50 px-3 py-1 rounded-lg border border-amber-200">{fmt(totalPendingAmt)}</span>
                </div>
            )}

            {/* ── Request table ── */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden mb-10">
                <div className="px-5 py-4 border-b border-[#f1f5f9] flex flex-col gap-1">
                    <h3 className="text-[15px] font-bold text-[#0f172a]">Payment Requests</h3>
                    <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">{requests.length} total requests</p>
                </div>

                <div className="overflow-x-auto overflow-y-hidden">
                    <table className="w-full text-sm table-fixed">
                        <colgroup>
                            <col className="w-28" />  {/* Mã yêu cầu */}
                            <col className="w-28" />  {/* Loại */}
                            <col className="w-32" />  {/* Số tiền */}
                            <col className="w-auto" />  {/* Ghi chú HR */}
                            <col className="w-32" />  {/* Trạng thái */}
                            <col className="w-48" />  {/* Thao tác */}
                        </colgroup>
                        <thead>
                            <tr className="border-b border-[#e2e8f0]">
                                <th className="px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">Request ID</th>
                                <th className="px-4 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">Type</th>
                                <th className="px-4 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">Amount</th>
                                <th className="px-4 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">HR Note</th>
                                <th className="px-4 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">Status</th>
                                <th className="px-4 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reqLoad ? (
                                <tr><td colSpan={6} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-7 h-7 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm text-slate-400 font-medium">Loading...</span>
                                    </div>
                                </td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan={6} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                        <p className="text-sm font-semibold text-slate-400">No payment requests found.</p>
                                    </div>
                                </td></tr>
                            ) : (
                                requests.map(r => (
                                    <tr key={r.requestId} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors group">
                                        {/* Request ID */}
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="font-bold text-[#0f172a] font-mono text-xs group-hover:text-blue-600 transition-colors">#{r.requestId.substring(0, 8)}</div>
                                            <div className="text-[10px] text-[#64748b] font-mono mt-0.5">Batch: {r.payrollBatchId.substring(0, 8)}</div>
                                        </td>
                                        {/* Type */}
                                        <td className="px-4 py-3.5 text-center">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold border ${REQUEST_TYPE[r.type]?.bg} ${REQUEST_TYPE[r.type]?.text} ${REQUEST_TYPE[r.type]?.border}`}>
                                                {REQUEST_TYPE[r.type]?.label ?? r.type}
                                            </span>
                                        </td>
                                        {/* Amount */}
                                        <td className="px-4 py-3.5 text-center">
                                            <span className="font-black text-[#0f172a] tabular-nums">{fmt(r.totalAmountRequested)}</span>
                                        </td>
                                        {/* HR Note */}
                                        <td className="px-4 py-3.5 text-center">
                                            <p className="text-xs text-[#334155] font-medium leading-snug">{r.hrNote || "—"}</p>
                                        </td>
                                        {/* Status */}
                                        <td className="px-4 py-3.5 text-center">
                                            <Badge status={r.status} cfg={REQUEST_STATUS} />
                                        </td>
                                        {/* Actions */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button onClick={() => setViewDetailItem(r)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="View Details">
                                                    {Icon.eye}
                                                </button>
                                                <button onClick={async () => {
                                                        try { 
                                                            const blob = await downloadPaymentReport(r.requestId); 
                                                            const url = window.URL.createObjectURL(blob);
                                                            const a = document.createElement("a");
                                                            a.href = url;
                                                            a.download = `Payment_Report_${r.requestId.substring(0, 8)}.pdf`;
                                                            document.body.appendChild(a);
                                                            a.click();
                                                            window.URL.revokeObjectURL(url);
                                                            a.remove();
                                                        }
                                                        catch (e) { alert(getErrMsg(e)); }
                                                    }}
                                                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Download PDF">
                                                    {Icon.download}
                                                </button>
                                                {r.status === "PENDING" && (
                                                    <>
                                                        <div className="w-px h-4 bg-slate-200 mx-1" />
                                                        <button onClick={() => setRejectItem(r)} title="Reject"
                                                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer">
                                                            {Icon.close}
                                                        </button>
                                                        <button onClick={() => setApproveItem(r)} title="Approve"
                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer">
                                                            {Icon.checkCircle}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {viewDetailItem && (
                <ReportDetailModal request={viewDetailItem} onClose={() => setViewDetailItem(null)} />
            )}
            {approveItem && (
                <ReviewModal request={approveItem} mode="approve"
                    onSuccess={() => { setApproveItem(null); loadRequests(); }}
                    onClose={() => setApproveItem(null)} />
            )}
            {rejectItem && (
                <ReviewModal request={rejectItem} mode="reject"
                    onSuccess={() => { setRejectItem(null); loadRequests(); }}
                    onClose={() => setRejectItem(null)} />
            )}
        </div>
    );
};

export default FinancePayrollView;
