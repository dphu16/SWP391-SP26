import React, { useState, useEffect, useCallback } from "react";
import { Icon, fmt, getErrMsg, Badge } from "./PayrollModule";
import {
    getFinanceRequests, approveAndExecutePayment, rejectPaymentRequest,
    getPaymentBatches, getPaymentTransactions, getTaxInsuranceReport,
    type PaymentRequestDTO, type PaymentBatchHistoryDTO,
    type PaymentTransactionHistoryDTO, type FinanceAccountDTO,
    type TaxInsuranceDTO,
} from "../../services/payrollService";
import apiClient from "../../services/apiClient";

// ─── Status Configs ────────────────────────────────────────────────────────────
const REQUEST_STATUS: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
    PENDING: { label: "Pending", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    APPROVED: { label: "Approved", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    PAID: { label: "Paid", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    REJECTED: { label: "Rejected", dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
};

const BATCH_STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
    PROCESSING: { label: "Processing", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    COMPLETED: { label: "Completed", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    FAILED: { label: "Failed", dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
};

const TXN_STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
    SUCCESS: { label: "Success", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    FAILED: { label: "Failed", dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
    PENDING: { label: "Pending", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
};

const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (d?: string | null) =>
    d ? new Date(d).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// ─── Approve & Execute Modal ───────────────────────────────────────────────────
const ApproveModal: React.FC<{
    request: PaymentRequestDTO;
    accounts: FinanceAccountDTO[];
    onSuccess: () => void;
    onClose: () => void;
}> = ({ request, accounts, onSuccess, onClose }) => {
    const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.accountId || "");
    const [bankRefCode, setBankRefCode] = useState("");
    const [financeNote, setFinanceNote] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const selectedAccount = accounts.find(a => a.accountId === sourceAccountId);
    const hasBalance = selectedAccount && selectedAccount.currentBalance >= request.totalAmountRequested;

    const submit = async () => {
        if (!sourceAccountId) { setErr("Please select a source account."); return; }
        if (!bankRefCode.trim()) { setErr("Please enter a bank reference code."); return; }
        setBusy(true); setErr("");
        try {
            await approveAndExecutePayment({
                requestId: request.requestId,
                sourceAccountId,
                bankRefCode: bankRefCode.trim(),
                financeNote: financeNote.trim() || undefined,
            });
            onSuccess();
            onClose();
        } catch (e) { setErr(getErrMsg(e)); }
        finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <span className="text-white">{Icon.checkCircle}</span>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Duyệt & Thực hiện Chi trả</h3>
                            <p className="text-xs text-slate-500">Số tiền: <span className="font-bold text-emerald-700">{fmt(request.totalAmountRequested)}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">{Icon.close}</button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {err && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
                            {Icon.warning} {err}
                        </div>
                    )}

                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Payroll Batch</p>
                            <p className="text-sm font-bold text-slate-800 truncate">{request.payrollBatchId.slice(-8).toUpperCase()}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Total Amount</p>
                            <p className="text-sm font-bold text-emerald-700">{fmt(request.totalAmountRequested)}</p>
                        </div>
                    </div>

                    {/* Account selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Source Account</label>
                        <select value={sourceAccountId} onChange={e => setSourceAccountId(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                            {accounts.filter(a => a.status === "ACTIVE").map(a => (
                                <option key={a.accountId} value={a.accountId}>
                                    {a.accountName} — {a.bankName} ({fmt(a.currentBalance)})
                                </option>
                            ))}
                        </select>
                        {selectedAccount && !hasBalance && (
                            <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">{Icon.warning} Insufficient balance! Need {fmt(request.totalAmountRequested - selectedAccount.currentBalance)} more</p>
                        )}
                        {selectedAccount && hasBalance && (
                            <p className="text-xs text-emerald-600 mt-1">✓ Available balance: {fmt(selectedAccount.currentBalance)}</p>
                        )}
                    </div>

                    {/* Bank ref code */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Bank Reference Code</label>
                        <input type="text" value={bankRefCode} onChange={e => setBankRefCode(e.target.value)}
                            placeholder="e.g. TXN20260304..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono" />
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Ghi chú Finance (tuỳ chọn)</label>
                        <textarea rows={2} value={financeNote} onChange={e => setFinanceNote(e.target.value)}
                            placeholder="Ghi chú..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-white cursor-pointer">Huỷ</button>
                    <button onClick={submit} disabled={busy || !hasBalance}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${busy ? "bg-emerald-400 text-white cursor-wait"
                            : !hasBalance ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 cursor-pointer"
                            }`}>
                        {busy ? "Đang xử lý..." : "Duyệt & Chi trả"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Reject Modal ──────────────────────────────────────────────────────────────
const RejectModal: React.FC<{
    request: PaymentRequestDTO;
    onSuccess: () => void;
    onClose: () => void;
}> = ({ request, onSuccess, onClose }) => {
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const submit = async () => {
        if (!note.trim()) { setErr("Please enter a rejection reason."); return; }
        setBusy(true); setErr("");
        try {
            await rejectPaymentRequest(
                request.requestId,
                note.trim()
            );
            onSuccess();
            onClose();
        } catch (e) { setErr(getErrMsg(e)); }
        finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-red-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center">
                            <span className="text-white">{Icon.close}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Reject Request</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">{Icon.close}</button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {err && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{Icon.warning} {err}</div>}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                        <p className="text-xs text-slate-500">Requested amount: <span className="font-bold text-slate-800">{fmt(request.totalAmountRequested)}</span></p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Rejection Reason <span className="text-rose-500">*</span></label>
                        <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                            placeholder="Enter reason..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none" />
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-white cursor-pointer">Cancel</button>
                    <button onClick={submit} disabled={busy}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold ${busy ? "bg-rose-400 text-white cursor-wait" : "bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"}`}>
                        {busy ? "Processing..." : "Confirm Rejection"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Transaction Drawer ────────────────────────────────────────────────────────
const TransactionDrawer: React.FC<{
    batch: PaymentBatchHistoryDTO;
    onClose: () => void;
}> = ({ batch, onClose }) => {
    const [txns, setTxns] = useState<PaymentTransactionHistoryDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        getPaymentTransactions(batch.paymentBatchId)
            .then((d: import("../../services/payrollService").PageResponse<import("../../services/payrollService").PaymentTransactionHistoryDTO>) => setTxns(d.content))
            .catch(() => {/* silent */ })
            .finally(() => setLoading(false));
    }, [batch.paymentBatchId]);

    const filtered = txns.filter(t => t.employeeName.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full sm:max-w-2xl mx-0 sm:mx-4 max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Transaction Details</h3>
                        <p className="text-xs text-slate-500">{String(batch.month).padStart(2, "0")}/{batch.year} — {batch.totalTransactions} transactions</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">{Icon.close}</button>
                </div>

                {/* Search */}
                <div className="px-4 py-3 border-b border-slate-50 flex-shrink-0">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{Icon.search}</span>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by employee name..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="py-10 text-center text-slate-400 text-sm">Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 text-sm">No data found</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                                <tr>
                                    {["Nhân viên", "Số tiền", "Mã tham chiếu", "Trạng thái", "Thời gian"].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map(txn => (
                                    <tr key={txn.transactionId} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                                                    {txn.employeeName?.charAt(0).toUpperCase() || "?"}
                                                </div>
                                                <span className="font-medium text-slate-800">{txn.employeeName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-800">{fmt(txn.amount)}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{txn.bankResponseCode || "—"}</td>
                                        <td className="px-4 py-3"><Badge status={txn.status} cfg={TXN_STATUS_CFG} /></td>
                                        <td className="px-4 py-3 text-xs text-slate-400">{fmtDateTime(txn.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer summary */}
                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0 text-xs text-slate-500">
                    <span>Successful: <span className="font-bold text-emerald-700">{batch.successTransactions}</span></span>
                    <span>Failed: <span className="font-bold text-rose-600">{batch.failedTransactions}</span></span>
                    <span>Total: <span className="font-bold text-slate-800">{fmt(batch.totalAmount)}</span></span>
                </div>
            </div>
        </div>
    );
};

// ─── Tax & Insurance Drawer ───────────────────────────────────────────────────
const TaxInsuranceDrawer: React.FC<{
    request: PaymentRequestDTO;
    onClose: () => void;
}> = ({ request, onClose }) => {
    const [data, setData] = useState<TaxInsuranceDTO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTaxInsuranceReport(request.payrollBatchId)
            .then(d => setData(d))
            .catch(() => {/* silent */ })
            .finally(() => setLoading(false));
    }, [request.payrollBatchId]);

    const totalGross = data.reduce((s, d) => s + d.grossSalary, 0);
    const totalBhxh = data.reduce((s, d) => s + d.bhxh, 0);
    const totalBhyt = data.reduce((s, d) => s + d.bhyt, 0);
    const totalBhtn = data.reduce((s, d) => s + d.bhtn, 0);
    const totalPit = data.reduce((s, d) => s + d.pit, 0);
    const totalInsurances = data.reduce((s, d) => s + d.totalIns, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full sm:max-w-5xl mx-0 sm:mx-4 max-h-[85vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-700">
                    <div>
                        <h3 className="text-base font-bold text-white">Báo cáo Thuế & Bảo hiểm (Finance)</h3>
                        <p className="text-xs text-blue-100">Batch ID: {request.payrollBatchId.slice(-8).toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-white hover:bg-white/20 cursor-pointer">{Icon.close}</button>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                    {loading ? (
                        <div className="py-10 text-center text-slate-400">Loading...</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Tổng BHXH (8%)</p>
                                    <p className="text-lg font-bold text-rose-600">{fmt(totalBhxh)}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Tổng BHYT (1.5%)</p>
                                    <p className="text-lg font-bold text-rose-600">{fmt(totalBhyt)}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Tổng BHTN (1%)</p>
                                    <p className="text-lg font-bold text-rose-600">{fmt(totalBhtn)}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Tổng Thuế TNCN (PIT)</p>
                                    <p className="text-lg font-bold text-rose-600">{fmt(totalPit)}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-100 text-slate-500 uppercase tracking-wide bg-gradient-to-r from-slate-100 to-slate-50">
                                            <tr>
                                                <th className="px-4 py-3">Nhân viên</th>
                                                <th className="px-4 py-3 text-right">Gross Salary</th>
                                                <th className="px-4 py-3 text-right">Base (Tính BH)</th>
                                                <th className="px-4 py-3 text-right">Tổng BH (10.5%)</th>
                                                <th className="px-4 py-3 text-right">Thuế TNCN</th>
                                                <th className="px-4 py-3 text-right">Tổng Khấu trừ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {data.map(d => (
                                                <tr key={d.employeeId} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 font-semibold text-slate-700">{d.employeeName}</td>
                                                    <td className="px-4 py-3 text-right text-slate-700">{fmt(d.grossSalary)}</td>
                                                    <td className="px-4 py-3 text-right text-slate-500">{fmt(d.baseSalary)}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-rose-600">{Math.round(d.totalIns) > 0 ? "-" + fmt(d.totalIns) : "—"}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-rose-600">{Math.round(d.pit) > 0 ? "-" + fmt(d.pit) : "—"}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-800">{Math.round(d.totalDeduct) > 0 ? "-" + fmt(d.totalDeduct) : "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-slate-200 bg-slate-50">
                                                <td className="px-4 py-3 font-bold text-slate-700">Tổng toàn cơ quan:</td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-800">{fmt(totalGross)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-500">—</td>
                                                <td className="px-4 py-3 text-right font-bold text-rose-600">-{fmt(totalInsurances)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-rose-600">-{fmt(totalPit)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-800">-{fmt(totalInsurances + totalPit)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN: Finance Payroll Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
const FinancePayrollView: React.FC = () => {
    const [tab, setTab] = useState<"requests" | "history">("requests");

    // ── Requests state ─────────────────────────────────────────────────────────
    const [requests, setRequests] = useState<PaymentRequestDTO[]>([]);
    const [reqLoad, setReqLoad] = useState(true);
    const [reqFilter, setReqFilter] = useState<"" | "PENDING" | "APPROVED" | "PAID" | "REJECTED">("");
    const [approveItem, setApproveItem] = useState<PaymentRequestDTO | null>(null);
    const [rejectItem, setRejectItem] = useState<PaymentRequestDTO | null>(null);
    const [taxReportItem, setTaxReportItem] = useState<PaymentRequestDTO | null>(null);
    const [accounts, setAccounts] = useState<FinanceAccountDTO[]>([]);

    // ── History state ──────────────────────────────────────────────────────────
    const [batches, setBatches] = useState<PaymentBatchHistoryDTO[]>([]);
    const [batchLoad, setBatchLoad] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<PaymentBatchHistoryDTO | null>(null);

    const loadRequests = useCallback(async () => {
        setReqLoad(true);
        try {
            const data = await getFinanceRequests(reqFilter || undefined);
            setRequests(data);
        } catch { setRequests([]); }
        finally { setReqLoad(false); }
    }, [reqFilter]);

    const loadBatches = useCallback(async () => {
        setBatchLoad(true);
        try {
            const data = await getPaymentBatches(0, 50);
            setBatches(data.content);
        } catch { setBatches([]); }
        finally { setBatchLoad(false); }
    }, []);

    const loadAccounts = useCallback(async () => {
        try {
            const res = await apiClient.get("/api/finance/accounts");
            setAccounts(res.data);
        } catch { /* endpoint may not exist yet */ }
    }, []);

    useEffect(() => { loadRequests(); }, [loadRequests]);
    useEffect(() => { if (tab === "history") loadBatches(); }, [tab, loadBatches]);
    useEffect(() => { loadAccounts(); }, [loadAccounts]);

    // Auto-refresh requests every 15s when on requests tab
    useEffect(() => {
        if (tab !== "requests") return;
        const timer = setInterval(() => { loadRequests(); }, 15000);
        return () => clearInterval(timer);
    }, [tab, loadRequests]);


    // ── Derived stats ──────────────────────────────────────────────────────────
    const pendingCount = requests.filter(r => r.status === "PENDING").length;
    const totalPending = requests.filter(r => r.status === "PENDING").reduce((s, r) => s + r.totalAmountRequested, 0);

    const tabs: { key: "requests" | "history"; label: string }[] = [
        { key: "requests", label: "Payment Requests" },
        { key: "history", label: "Payment History" },
    ];

    return (
        <>
            {/* ── Header Stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {[
                    {
                        icon: Icon.warning,
                        label: "Pending Approval",
                        value: pendingCount,
                        sub: "requests",
                        color: "from-amber-500 to-orange-500",
                        bg: "bg-amber-50",
                        textColor: "text-amber-700",
                    },
                    {
                        icon: Icon.money,
                        label: "Total Pending Amount",
                        value: fmt(totalPending),
                        sub: "awaiting payment",
                        color: "from-emerald-500 to-teal-600",
                        bg: "bg-emerald-50",
                        textColor: "text-emerald-700",
                    },
                    {
                        icon: Icon.checkCircle,
                        label: "Completed",
                        value: requests.filter(r => r.status === "PAID").length,
                        sub: "PAID requests",
                        color: "from-blue-500 to-indigo-600",
                        bg: "bg-blue-50",
                        textColor: "text-blue-700",
                    },
                ].map((s, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4 shadow-sm">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                            <span className="text-white scale-125">{s.icon}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.textColor} leading-tight`}>{s.value}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-5">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`relative inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${tab === t.key ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}>
                        {t.label}
                        {t.key === "requests" && pendingCount > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab: Requests ── */}
            {tab === "requests" && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Payment Requests</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{requests.length} total requests</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <select value={reqFilter} onChange={e => setReqFilter(e.target.value as typeof reqFilter)}
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer">
                                <option value="">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="PAID">Paid</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                            <button onClick={loadRequests}
                                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer">
                                {Icon.refresh}
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    {reqLoad ? (
                        <div className="py-16 text-center">
                            <span className="animate-spin inline-block scale-150 text-slate-400">{Icon.refresh}</span>
                            <p className="mt-4 text-sm font-semibold text-slate-500">Loading data...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300 text-2xl">{Icon.inbox}</div>
                            <p className="text-sm font-semibold text-slate-600">No payment requests</p>
                            <p className="text-xs text-slate-400 mt-1">When HR creates a payroll request, it will appear here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        {["Payroll Batch", "Amount", "HR Note", "Status", "Created", "Actions"].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {requests.map(req => (
                                        <tr key={req.requestId} className="hover:bg-slate-50/60 transition-colors group">
                                            <td className="px-4 py-4">
                                                <div>
                                                    <p className="font-mono text-xs font-bold text-slate-700">{req.payrollBatchId.slice(-12).toUpperCase()}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">ID: {req.requestId.slice(-8)}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="font-bold text-slate-800 text-base">{fmt(req.totalAmountRequested)}</span>
                                            </td>
                                            <td className="px-4 py-4 text-slate-500 max-w-[160px]">
                                                <p className="truncate text-xs">{req.hrNote || "—"}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge status={req.status} cfg={REQUEST_STATUS} />
                                            </td>
                                            <td className="px-4 py-4 text-xs text-slate-400 whitespace-nowrap">{fmtDate(req.createdAt)}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-2 relative">
                                                    {(req.status === "PENDING" || req.status === "APPROVED") && (
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => setApproveItem(req)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer shadow-sm">
                                                                {Icon.checkCircle} Duyệt & Chi
                                                            </button>
                                                            <button onClick={() => setRejectItem(req)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer">
                                                                {Icon.close} Từ chối
                                                            </button>
                                                        </div>
                                                    )}
                                                    {req.status === "PAID" && (
                                                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">{Icon.checkCircle} Completed</span>
                                                    )}
                                                    {req.status === "REJECTED" && (
                                                        <span className="text-xs text-rose-500 font-medium">{req.financeNote || "Rejected"}</span>
                                                    )}

                                                    {localStorage.getItem(`tax_report_sent_${req.payrollBatchId}`) === "true" && (
                                                        <button onClick={() => setTaxReportItem(req)}
                                                            className="w-fit inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
                                                            {Icon.wallet} Xem Thuế & Bảo hiểm
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Tab: History ── */}
            {tab === "history" && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Payment Batch History</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{batches.length} batches</p>
                        </div>
                        <button onClick={loadBatches}
                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors">
                            {Icon.refresh}
                        </button>
                    </div>

                    {batchLoad ? (
                        <div className="py-16 text-center">
                            <span className="animate-spin inline-block scale-150 text-slate-400">{Icon.refresh}</span>
                            <p className="mt-4 text-sm font-semibold text-slate-500">Loading...</p>
                        </div>
                    ) : batches.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300 text-2xl">{Icon.inbox}</div>
                            <p className="text-sm font-semibold text-slate-600">No payment batches yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        {["Period", "Total", "Transactions", "Success", "Failed", "Status", "Created", "Completed", ""].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {batches.map(b => (
                                        <tr key={b.paymentBatchId} className="hover:bg-slate-50/60 transition-colors group">
                                            <td className="px-4 py-4 font-bold text-slate-800 whitespace-nowrap">
                                                {String(b.month).padStart(2, "0")}/{b.year}
                                            </td>
                                            <td className="px-4 py-4 font-bold text-emerald-700">{fmt(b.totalAmount)}</td>
                                            <td className="px-4 py-4 text-slate-600 font-semibold">{b.totalTransactions}</td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    {b.successTransactions}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {b.failedTransactions > 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                        {b.failedTransactions}
                                                    </span>
                                                ) : <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className="px-4 py-4"><Badge status={b.status} cfg={BATCH_STATUS_CFG} /></td>
                                            <td className="px-4 py-4 text-xs text-slate-400 whitespace-nowrap">{fmtDate(b.createdAt)}</td>
                                            <td className="px-4 py-4 text-xs text-slate-400 whitespace-nowrap">{fmtDate(b.completedAt)}</td>
                                            <td className="px-4 py-4">
                                                <button onClick={() => setSelectedBatch(b)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                                                    {Icon.layers} Transactions
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}


            {/* ── Modals ── */}
            {approveItem && (
                <ApproveModal
                    request={approveItem}
                    accounts={accounts}
                    onSuccess={loadRequests}
                    onClose={() => setApproveItem(null)}
                />
            )}
            {rejectItem && (
                <RejectModal
                    request={rejectItem}
                    onSuccess={loadRequests}
                    onClose={() => setRejectItem(null)}
                />
            )}
            {taxReportItem && (
                <TaxInsuranceDrawer
                    request={taxReportItem}
                    onClose={() => setTaxReportItem(null)}
                />
            )}
            {selectedBatch && (
                <TransactionDrawer
                    batch={selectedBatch}
                    onClose={() => setSelectedBatch(null)}
                />
            )}
        </>
    );
};

export default FinancePayrollView;
