import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "./PayrollModule";
import {
    getPayslipsByBatch, confirmPayslip, cancelPayslip,
    createPeriod, getAllPeriods, closePeriod, getAllInquiries, calculatePayslips, validateAllInBatch,
    createPaymentRequest, markInquiryInProgress, respondToInquiry, rejectInquiry, getActiveFinanceAccounts,
    getMyPaymentRequests, updatePayslipDetails,
    type PayrollPeriodResponse, type PayslipResponse, type SalaryInquiryDto, type PaymentRequestResponse,
    type UpdatePayslipDetailItem
} from "../../services/payrollService";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n?: number | null) =>
    n != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n) : "—";

const getErrMsg = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } | string } };
    if (typeof err?.response?.data === "string") return err.response.data;
    return err?.response?.data?.message ?? "An unexpected error occurred.";
};

const fmtPeriod = (period?: string | null) => {
    if (!period) return "—";
    const d = new Date(period);
    return `Month ${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

// ─── Sub-components ────────────────────────────────────────────────────────────
const InquiryBadge: React.FC<{ status: string }> = ({ status }) => {
    const cfg: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
        OPEN: { label: "New", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
        IN_PROGRESS: { label: "In Progress", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
        RESOLVED: { label: "Resolved", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
        REJECTED: { label: "Rejected", dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
    };
    const c = cfg[status] ?? cfg.OPEN;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${c.text} ${c.bg} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
};

const HRInquiriesModal: React.FC<{ onClose: () => void; onRefreshCount: () => void }> = ({ onClose, onRefreshCount }) => {
    const [inquiries, setInquiries] = useState<SalaryInquiryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyAction, setReplyAction] = useState<"APPROVE" | "REJECT" | null>(null);
    const [replyText, setReplyText] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [activeTab, setActiveTab] = useState<"OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED">("OPEN");

    const loadData = useCallback(async () => {
        setLoading(true); setErr("");
        try {
            const data = await getAllInquiries();
            setInquiries(data);
            onRefreshCount();
        } catch (e) { setErr(getErrMsg(e)); }
        finally { setLoading(false); }
    }, [onRefreshCount]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleMarkProgress = async (id: string) => {
        setBusy(true);
        try {
            await markInquiryInProgress(id);
            await loadData();
        } catch (e) { setErr(getErrMsg(e)); }
        finally { setBusy(false); }
    };

    const handleSubmitReply = async (id: string) => {
        if (!replyText.trim()) return;
        setBusy(true);
        try {
            if (replyAction === "APPROVE") {
                await respondToInquiry({ inquiryId: id, officialResponse: replyText });
                setActiveTab("RESOLVED");
            } else if (replyAction === "REJECT") {
                await rejectInquiry(id, replyText);
                setActiveTab("REJECTED");
            }
            setReplyingTo(null);
            setReplyAction(null);
            setReplyText("");
            await loadData();
        } catch (e) { setErr(getErrMsg(e)); }
        finally { setBusy(false); }
    };

    const TABS: { key: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED"; label: string; color: string; activeClass: string }[] = [
        { key: "OPEN", label: "New", color: "text-blue-600", activeClass: "bg-blue-600 text-white" },
        { key: "IN_PROGRESS", label: "In Progress", color: "text-amber-600", activeClass: "bg-amber-500 text-white" },
        { key: "RESOLVED", label: "Resolved", color: "text-emerald-600", activeClass: "bg-emerald-600 text-white" },
        { key: "REJECTED", label: "Rejected", color: "text-rose-600", activeClass: "bg-rose-500 text-white" },
    ];

    const filtered = inquiries.filter(i => i.status === activeTab);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Employee Salary Inquiries</h2>
                        <p className="text-xs text-slate-400 mt-0.5">{inquiries.length} total inquiries</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-200">{Icon.close}</button>
                </div>

                {/* 4 Status Tabs */}
                <div className="px-6 pt-4 pb-0 border-b border-slate-100 flex gap-1">
                    {TABS.map(tab => {
                        const count = inquiries.filter(i => i.status === tab.key).length;
                        const isActive = activeTab === tab.key;
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${isActive
                                    ? `border-current ${tab.color} border-b-current bg-transparent`
                                    : "border-transparent text-slate-400 hover:text-slate-600"
                                    }`}>
                                {tab.label}
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? tab.activeClass : "bg-slate-100 text-slate-500"
                                    }`}>{count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {err && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-sm mb-4">{err}</div>}
                    {loading ? (
                        <div className="py-12 text-center text-slate-400 animate-pulse">Loading data...</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center text-slate-400 space-y-2">
                            <svg className="w-10 h-10 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            <p className="text-sm font-semibold text-slate-500">
                                {activeTab === "OPEN" && "No new inquiries."}
                                {activeTab === "IN_PROGRESS" && "No inquiries in progress."}
                                {activeTab === "RESOLVED" && "No resolved inquiries yet."}
                                {activeTab === "REJECTED" && "No rejected inquiries yet."}
                            </p>
                        </div>
                    ) : (
                        filtered.map(inq => (
                            <div key={inq.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white hover:border-slate-300 transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800">{inq.subject}</span>
                                            <InquiryBadge status={inq.status} />
                                        </div>
                                        <p className="text-xs text-slate-500">From: <span className="font-semibold">{inq.employeeName}</span> • {new Date(inq.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* OPEN: Accept */}
                                        {inq.status === "OPEN" && (
                                            <button onClick={() => handleMarkProgress(inq.id)} disabled={busy}
                                                className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 cursor-pointer transition-colors">
                                                Accept
                                            </button>
                                        )}
                                        {/* IN_PROGRESS: Approve (-> RESOLVED) + Reject */}
                                        {inq.status === "IN_PROGRESS" && replyingTo !== inq.id && (
                                            <button onClick={() => { setReplyingTo(inq.id); setReplyAction("APPROVE"); setReplyText(""); }}
                                                className="px-3 py-1.5 text-xs font-bold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 cursor-pointer transition-colors flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                Approve
                                            </button>
                                        )}
                                        {inq.status !== "RESOLVED" && inq.status !== "REJECTED" && replyingTo !== inq.id && (
                                            <button onClick={() => { setReplyingTo(inq.id); setReplyAction("REJECT"); setReplyText(""); }} disabled={busy}
                                                className="px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 disabled:opacity-50 cursor-pointer transition-colors">
                                                Reject
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                                    {inq.message}
                                </div>

                                {inq.hrResponse && (
                                    <div className={`${inq.status === "REJECTED" ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"} border rounded-lg p-3`}>
                                        <p className={`text-[10px] font-bold ${inq.status === "REJECTED" ? "text-rose-700" : "text-emerald-700"} uppercase tracking-wide mb-1`}>Official Response:</p>
                                        <p className="text-sm text-slate-700">{inq.hrResponse.officialResponse}</p>
                                    </div>
                                )}

                                {replyingTo === inq.id ? (
                                    <div className="space-y-3 pt-2 border-t border-slate-100">
                                        <p className={`text-xs font-bold ${replyAction === "APPROVE" ? "text-emerald-700" : "text-rose-700"}`}>
                                            {replyAction === "APPROVE" ? "Enter response to approve (→ Resolved):" : "Enter rejection reason (→ Rejected):"}
                                        </p>
                                        <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                                            className={`w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:outline-none ${replyAction === "APPROVE" ? "focus:ring-emerald-400" : "focus:ring-rose-400"}`}
                                            rows={3} placeholder={replyAction === "APPROVE" ? "Enter official response..." : "Enter rejection reason..."} />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setReplyingTo(null); setReplyAction(null); setReplyText(""); }} className="px-4 py-2 text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-700">Cancel</button>
                                            <button onClick={() => handleSubmitReply(inq.id)} disabled={busy || !replyText.trim()}
                                                className={`px-4 py-2 text-xs font-bold text-white rounded-lg disabled:opacity-50 cursor-pointer ${replyAction === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}>
                                                {replyAction === "APPROVE" ? "Confirm Approval" : "Confirm Rejection"}
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const CreatePeriodModal: React.FC<{ onCreated: () => void; onClose: () => void }> = ({ onCreated, onClose }) => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    // Bug Fix #4: thêm startDate và endDate (optional)
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const create = async () => {
        // Validate ngay trên UI nếu HR điền cả 2 field
        if (startDate && endDate && startDate > endDate) {
            setErr("Start date must be before or equal to end date.");
            return;
        }
        setBusy(true); setErr("");
        try {
            await createPeriod({
                month, year,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            });
            onCreated();
        } catch (e) { setErr(getErrMsg(e)); }
        finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-emerald-50">
                    <h3 className="text-base font-bold text-slate-900">Create New Payroll Period</h3>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {err && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">{err}</div>}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Month</label>
                            <select value={month} onChange={e => setMonth(Number(e.target.value))}
                                className="w-full mt-1 px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Year</label>
                            <select value={year} onChange={e => setYear(Number(e.target.value))}
                                className="w-full mt-1 px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none">
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    {/* Bug Fix #4: Start Date & End Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">End Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                min={startDate || undefined}
                                className="w-full mt-1 px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-500">Close</button>
                    <button onClick={create} disabled={busy} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50">
                        {busy ? "Creating..." : "Create Period"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Edit Payslip Details Modal (UR_HR004) ─────────────────────────────────────
const EditPayslipDetailsModal: React.FC<{
    payslip: PayslipResponse;
    onClose: () => void;
    onSaved: (updated: PayslipResponse) => void;
}> = ({ payslip, onClose, onSaved }) => {
    const [items, setItems] = useState<UpdatePayslipDetailItem[]>(
        payslip.details && payslip.details.length > 0
            ? payslip.details.map(d => ({ itemName: d.itemName, amount: d.amount, type: d.type as "ALLOWANCE" | "DEDUCTION" }))
            : [{ itemName: "", amount: 0, type: "ALLOWANCE" }]
    );
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

    const addRow = () => setItems(prev => [...prev, { itemName: "", amount: 0, type: "ALLOWANCE" }]);
    const removeRow = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
    const updateRow = (i: number, field: keyof UpdatePayslipDetailItem, val: string | number) =>
        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

    const totalAllowances = items.filter(i => i.type === "ALLOWANCE").reduce((s, i) => s + Number(i.amount), 0);
    const totalDeductions = items.filter(i => i.type === "DEDUCTION").reduce((s, i) => s + Number(i.amount), 0);
    const base = payslip.baseSalary ?? 0;
    const ot = payslip.otPay ?? 0;
    const absent = payslip.absentDeduction ?? 0;
    const previewGross = base + ot + totalAllowances - absent;
    const previewNet = previewGross - totalDeductions;

    const handleSave = async () => {
        if (items.some(i => !i.itemName.trim())) { setErr("Item name cannot be empty."); return; }
        setBusy(true); setErr("");
        try {
            const updated = await updatePayslipDetails(payslip.payslipId, { details: items });
            onSaved(updated);
        } catch (e: unknown) {
            const err2 = e as { response?: { data?: { message?: string } } };
            setErr(err2?.response?.data?.message ?? "Failed to save details.");
        } finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-amber-50 flex justify-between items-start">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Edit Payslip Details</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{payslip.employeeName} — {payslip.month}/{payslip.year}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors">{Icon.close}</button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {err && <div className="p-3 bg-rose-50 text-rose-600 rounded-lg border border-rose-200 text-sm">{err}</div>}

                    {/* fixed fields */}
                    <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div><p className="text-slate-400 font-bold uppercase mb-0.5">Base Salary</p><p className="font-semibold text-slate-700">{fmt(base)}</p></div>
                        <div><p className="text-slate-400 font-bold uppercase mb-0.5">OT Pay</p><p className="font-semibold text-sky-600">{fmt(ot)}</p></div>
                        <div><p className="text-slate-400 font-bold uppercase mb-0.5">Absent Deduction</p><p className="font-semibold text-rose-600">-{fmt(absent)}</p></div>
                    </div>

                    {/* editable rows */}
                    <div className="space-y-2">
                        {items.map((item, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                                    placeholder="Item name"
                                    value={item.itemName}
                                    onChange={e => updateRow(i, "itemName", e.target.value)}
                                />
                                <input
                                    type="number" min={0}
                                    className="w-36 px-3 py-2 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-amber-400"
                                    value={item.amount}
                                    onChange={e => updateRow(i, "amount", Number(e.target.value))}
                                />
                                <select
                                    className="px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                                    value={item.type}
                                    onChange={e => updateRow(i, "type", e.target.value)}
                                >
                                    <option value="ALLOWANCE">Allowance</option>
                                    <option value="DEDUCTION">Deduction</option>
                                </select>
                                <button onClick={() => removeRow(i)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors flex-shrink-0">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={addRow} className="flex items-center gap-1.5 text-sm text-amber-700 font-semibold hover:text-amber-800 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add line item
                    </button>
                </div>

                {/* Preview footer */}
                <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 space-y-1 text-sm">
                    <div className="flex justify-between text-slate-500">
                        <span>Gross (preview)</span>
                        <span className="font-semibold text-slate-700">{fmt(previewGross)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold text-slate-700">Net (preview)</span>
                        <span className="font-black text-emerald-700 text-base">{fmt(previewNet)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
                    <button onClick={handleSave} disabled={busy}
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow disabled:opacity-50 transition-colors">
                        {busy ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const HRPayrollView: React.FC = () => {
    const [periods, setPeriods] = useState<PayrollPeriodResponse[]>([]);
    const [selPeriodId, setSelPeriodId] = useState<string>("");
    const [periodLoad, setPeriodLoad] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    const [payslips, setPayslips] = useState<PayslipResponse[]>([]);
    const [payslipLoad, setPayslipLoad] = useState(false);
    const [actionMsg, setActionMsg] = useState("");
    const [actionMsgType, setActionMsgType] = useState<"ok" | "err">("ok");
    const [actionBusy, setActionBusy] = useState<string | null>(null);

    const [showInquiries, setShowInquiries] = useState(false);
    const [pendingInqCount, setPendingInqCount] = useState(0);
    const [search, setSearch] = useState("");
    const [deptFilter, setDeptFilter] = useState("");
    const [paymentHistory, setPaymentHistory] = useState<PaymentRequestResponse[]>([]);
    const [historyLoad, setHistoryLoad] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [editingPayslip, setEditingPayslip] = useState<PayslipResponse | null>(null);

    // Derived
    const deptOptions = Array.from(new Set(payslips.map(p => p.departmentName).filter(Boolean))) as string[];
    const filteredPayslips = payslips.filter(p => {
        const matchName = !search || p.employeeName.toLowerCase().includes(search.toLowerCase());
        const matchDept = !deptFilter || p.departmentName === deptFilter;
        return matchName && matchDept;
    });

    const loadPeriods = useCallback(async () => {
        setPeriodLoad(true);
        try {
            const data = await getAllPeriods();
            // Sort descending by startDate to get the latest period first
            const sorted = [...data].sort((a, b) =>
                new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
            );
            setPeriods(sorted);
            if (sorted.length > 0) setSelPeriodId(sorted[0].periodId);
        } catch (e) { console.error(e); }
        finally { setPeriodLoad(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadInquiryCount = useCallback(async () => {
        try {
            const list = await getAllInquiries();
            setPendingInqCount(list.filter(i => i.status === "OPEN" || i.status === "IN_PROGRESS").length);
        } catch (e) { console.error(e); }
    }, []);

    const loadPaymentHistory = useCallback(async () => {
        setHistoryLoad(true);
        try {
            const data = await getMyPaymentRequests();
            setPaymentHistory(data);
        } catch (e) { console.error(e); }
        finally { setHistoryLoad(false); }
    }, []);

    useEffect(() => { loadPeriods(); loadInquiryCount(); }, [loadPeriods, loadInquiryCount]);

    const selPeriod = React.useMemo(() => periods.find(p => p.periodId === selPeriodId), [periods, selPeriodId]);
    const batchId = selPeriod?.batchId;
    const batchStatus = selPeriod?.batchStatus;
    const isPeriodClosed = selPeriod?.status === "PAID" || selPeriod?.status === "CLOSED";

    const loadPayslips = useCallback(async (bId: string) => {
        setPayslipLoad(true); setActionMsg("");
        try {
            const data = await getPayslipsByBatch(bId);
            setPayslips(data);
        } catch (e) { console.error(e); }
        finally { setPayslipLoad(false); }
    }, []);

    useEffect(() => {
        if (batchId) loadPayslips(batchId);
        else setPayslips([]);
    }, [batchId, loadPayslips]);

    const metrics = React.useMemo(() => {
        return payslips.reduce((acc, p) => {
            acc.emp += 1;
            acc.gross += p.grossSalary;
            acc.pit += p.taxAmount;
            acc.ins += p.insuranceAmount;
            if (p.status === "CONFIRMED") acc.confirmed += 1;
            if (p.status === "DRAFT") acc.draft += 1;
            if (p.totalAbsentDays > 0 || (p.grossSalary < p.totalDeductions)) acc.warnings += 1;
            return acc;
        }, { emp: 0, gross: 0, pit: 0, ins: 0, confirmed: 0, draft: 0, warnings: 0 });
    }, [payslips]);

    const handleCalculate = async () => {
        if (!batchId) return;
        setPayslipLoad(true); setActionMsg("");
        try {
            const data = await calculatePayslips(batchId);
            setPayslips(data);
            await loadPeriods(); // Refresh period/batch status after calculate
            setActionMsg("Salary calculated successfully."); setActionMsgType("ok");
        } catch (e) { setActionMsg(getErrMsg(e)); setActionMsgType("err"); }
        finally { setPayslipLoad(false); }
    };

    const handleConfirm = async (id: string) => {
        setActionBusy(id); setActionMsg("");
        try {
            await confirmPayslip(id);
            await loadPayslips(batchId!);
            await loadPeriods();
            setActionMsg("Payslip confirmed."); setActionMsgType("ok");
        } catch (e) { setActionMsg(getErrMsg(e)); setActionMsgType("err"); }
        finally { setActionBusy(null); }
    };

    const handleCancel = async (id: string) => {
        if (!window.confirm("Are you sure you want to cancel this payslip?")) return;
        setActionBusy(id); setActionMsg("");
        try {
            await cancelPayslip(id);
            await loadPayslips(batchId!);
            await loadPeriods();
            setActionMsg("Payslip cancelled."); setActionMsgType("ok");
        } catch (e) { setActionMsg(getErrMsg(e)); setActionMsgType("err"); }
        finally { setActionBusy(null); }
    };

    const handleConfirmAll = async () => {
        if (!batchId) return;
        setActionBusy("confirmAll"); setActionMsg("");
        try {
            await validateAllInBatch(batchId);
            await loadPayslips(batchId);
            await loadPeriods();
            setActionMsg(`All payslips confirmed successfully.`); setActionMsgType("ok");
        } catch (e) { setActionMsg(getErrMsg(e)); setActionMsgType("err"); }
        finally { setActionBusy(null); }
    };

    const handleClosePeriod = async () => {
        if (!selPeriodId) return;
        setActionBusy("closePeriod"); setActionMsg("");
        try {
            await closePeriod(selPeriodId);
            await loadPeriods();
            setActionMsg("Payroll period closed successfully."); setActionMsgType("ok");
        } catch (e) { setActionMsg(getErrMsg(e)); setActionMsgType("err"); }
        finally { setActionBusy(null); }
    };

    const handleSendToFinance = async () => {
        if (!batchId) return;
        setActionBusy("sendFinance"); setActionMsg("");
        try {
            const accs = await getActiveFinanceAccounts();
            if (!accs || accs.length === 0) throw new Error("No ACTIVE finance account found.");
            const periodLabel = selPeriod
                ? `Month ${String(selPeriod.month).padStart(2, "0")}/${selPeriod.year}`
                : "current period";
            await createPaymentRequest({
                payrollBatchId: batchId,
                hrNote: `Employee salary payment — ${periodLabel}`,
                type: "SALARY",
                sourceAccountId: accs[0].accountId
            });
            await loadPeriods();
            setActionMsg(`Salary payment request for ${periodLabel} sent to Finance.`); setActionMsgType("ok");
        } catch (e) { setActionMsg(getErrMsg(e)); setActionMsgType("err"); }
        finally { setActionBusy(null); }
    };

    const STATUS_CFG = {
        LOCKED: { label: "LOCKED", dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
        PROCESSED: { label: "PROCESSED", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
        VALIDATED: { label: "VALIDATED", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
        DRAFT: { label: "DRAFT", dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
    };

    const PR_STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
        PENDING: { label: "Pending", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
        APPROVED: { label: "Approved", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
        PAID: { label: "Paid", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
        REJECTED: { label: "Rejected", dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
    };
    const PR_TYPE_LABEL: Record<string, string> = {
        SALARY: "Salary Payment",
        TAX_INSURANCE: "Tax & Insurance",
    };

    return (
        <div className="flex flex-col pb-10 max-w-7xl mx-auto w-full">
            {/* Filter & Action Panel */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm mb-6 flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    {/* Choose period dropdown */}
                    <div className="flex-1 min-w-[280px] max-w-sm">
                        <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-2">Selected Payroll Period</label>
                        <div className="flex flex-col gap-2.5">
                            {periodLoad ? <div className="h-10 w-full bg-slate-100 animate-[shimmer_1.5s_infinite] rounded-lg" /> : (
                                <select value={selPeriodId} onChange={e => setSelPeriodId(e.target.value)}
                                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm font-medium text-[#0f172a] bg-white focus:outline-none focus:ring-1 focus:ring-[#10b981]/50 focus:border-[#10b981] transition-all appearance-none cursor-pointer shadow-sm"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: "right 0.75rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.25em 1.25em"
                                    }}>
                                    {periods.map(p => <option key={p.periodId} value={p.periodId}>{fmtPeriod(p.startDate)}{p.status ? ` — ${p.status}` : ""}</option>)}
                                </select>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Batch status badge */}
                                {batchStatus && (
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${STATUS_CFG[batchStatus as keyof typeof STATUS_CFG]?.text} ${STATUS_CFG[batchStatus as keyof typeof STATUS_CFG]?.bg} border ${STATUS_CFG[batchStatus as keyof typeof STATUS_CFG]?.border}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CFG[batchStatus as keyof typeof STATUS_CFG]?.dot}`} />
                                        Batch: {batchStatus}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Toolbar Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-6">
                        <button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-2 px-3 py-2 bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] hover:bg-[#dcfce7] rounded-lg font-bold text-sm transition-colors shadow-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            New Period
                        </button>
                        <button onClick={() => setShowInquiries(true)} className="relative flex items-center justify-center gap-2 px-3 py-2 bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#374151] rounded-lg font-bold text-sm border border-[#e2e8f0] transition-colors shadow-sm">
                            <svg className="w-4 h-4 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Inquiries
                            {pendingInqCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#ef4444] text-white text-[9px] flex items-center justify-center rounded-full shadow-sm">{pendingInqCount}</span>}
                        </button>
                        <div className="w-px h-6 bg-[#e2e8f0] mx-1 hidden sm:block"></div>
                        <button onClick={handleCalculate} disabled={payslipLoad || isPeriodClosed || batchStatus === "LOCKED"}
                            className="relative flex items-center justify-center gap-2 bg-[#10b981] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-[#059669] transition-all disabled:opacity-60 disabled:cursor-not-allowed border border-[#059669]">
                            {payslipLoad ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            )}
                            {payslipLoad ? "Processing..." : "Calculate Full Payroll"}
                        </button>
                    </div>
                </div>
            </div>

            {actionMsg && (
                <div className={`p-4 rounded-xl text-sm font-semibold border animate-in fade-in slide-in-from-top-2 ${actionMsgType === "ok" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                    <div className="flex items-center gap-2">
                        {actionMsgType === "ok" ? Icon.checkCircle : Icon.warning}
                        {actionMsg}
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-16 h-16 bg-[#e0f2fe] rounded-bl-full flex items-center justify-center text-[#0369a1] group-hover:bg-[#bae6fd] transition-colors">
                        {Icon.users}
                    </div>
                    <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-2">Employees</p>
                    <p className="text-2xl font-bold text-[#0f172a]">{metrics.emp} <span className="text-xs font-medium text-[#64748b]">Total</span></p>
                </div>
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-16 h-16 bg-[#dcfce7] rounded-bl-full flex items-center justify-center text-[#166534] group-hover:bg-[#bbf7d0] transition-colors">
                        {Icon.wallet}
                    </div>
                    <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-2">Gross Salary</p>
                    <p className="text-2xl font-bold text-[#0f172a]">{fmt(metrics.gross)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-16 h-16 bg-[#fef2f2] rounded-bl-full flex items-center justify-center text-[#b91c1c] group-hover:bg-[#fecaca] transition-colors">
                        {Icon.trendUp}
                    </div>
                    <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-2">PIT Deductions</p>
                    <p className="text-2xl font-bold text-[#0f172a]">{fmt(metrics.pit)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-16 h-16 bg-[#ede9fe] rounded-bl-full flex items-center justify-center text-[#6d28d9] group-hover:bg-[#ddd6fe] transition-colors">
                        {Icon.shield}
                    </div>
                    <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-2">Ins. Contributions</p>
                    <p className="text-2xl font-bold text-[#0f172a]">{fmt(metrics.ins)}</p>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden flex flex-col mb-10">
                {/* Table toolbar */}
                <div className="p-5 border-b border-[#f1f5f9] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-shrink-0">
                        <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            Payroll Details
                        </h3>
                        <p className="text-sm text-[#64748b] mt-1 ml-7">
                            Showing {filteredPayslips.length} of {metrics.emp} employees — {metrics.draft} pending confirmation
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search */}
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search employees..."
                                className="pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#10b981]/30 focus:border-[#10b981] w-48 placeholder:text-[#94a3b8]"
                            />
                        </div>
                        {/* Department filter */}
                        <div className="relative">
                            <select
                                value={deptFilter}
                                onChange={e => setDeptFilter(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-2 text-sm border border-[#e2e8f0] rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#10b981]/30 focus:border-[#10b981] cursor-pointer text-[#0f172a]"
                            >
                                <option value="">All Departments</option>
                                {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        {/* Clear filters */}
                        {(search || deptFilter) && (
                            <button onClick={() => { setSearch(""); setDeptFilter(""); }}
                                className="text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm table-fixed">
                        <thead>
                            <tr className="border-b border-[#e2e8f0]">
                                {/* 1 */}
                                <th className="w-[15%] px-5 py-3 text-left text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Employee</th>
                                {/* 2 */}
                                <th className="w-[10%] px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Department</th>
                                {/* 3 */}
                                <th className="w-[10%] px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Base Salary</th>
                                {/* 4 */}
                                <th className="w-[7%] px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">OT (H)</th>
                                {/* 5 */}
                                <th className="w-[8%] px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">OT Pay</th>
                                {/* 6 */}
                                <th className="w-[7%] px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Penalty (H)</th>
                                {/* 7 */}
                                <th className="w-[8%] px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Deduct</th>
                                {/* 8 */}
                                <th className="w-[12%] px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Net Salary</th>
                                {/* 9 */}
                                <th className="w-[10%] px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Status</th>
                                {/* 10 */}
                                <th className="w-[13%] px-5 py-3 text-center text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payslipLoad ? (
                                <tr><td colSpan={10} className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-2 border-[#10b981]/30 border-t-[#10b981] rounded-full animate-spin" />
                                        <span className="text-sm text-[#94a3b8] font-medium">Loading payroll data...</span>
                                    </div>
                                </td></tr>
                            ) : payslips.length === 0 ? (
                                <tr><td colSpan={10} className="p-10 text-center">
                                    <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                    </div>
                                    <p className="text-[#94a3b8] text-sm font-medium">No payslip data for this period.</p>
                                </td></tr>
                            ) : (
                                filteredPayslips.map(p => {
                                    const gross = p.grossSalary ?? 0;
                                    const taxPct = gross > 0 ? ((p.taxAmount ?? 0) / gross * 100).toFixed(1) : "0";
                                    const insPct = gross > 0 ? ((p.insuranceAmount ?? 0) / gross * 100).toFixed(1) : "0";
                                    return (
                                        <tr key={p.payslipId} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                                            {/* 1 — Employee */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-[#e6faf3] flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-4 h-4 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-[#0f172a] text-[13px] whitespace-nowrap">{p.employeeName}</div>
                                                        <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5">#{p.payslipId.substring(0, 8)}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 2 — Department */}
                                            <td className="px-5 py-4 text-center">
                                                <div className="font-medium text-[#334155] text-[13px] whitespace-nowrap">{p.departmentName || "—"}</div>
                                            </td>

                                            {/* 3 — Base Salary */}
                                            <td className="px-5 py-4 text-center font-semibold text-[#0f172a] text-[13px] tabular-nums whitespace-nowrap">
                                                {fmt(p.baseSalary)}
                                            </td>

                                            {/* 4 — OT (H) */}
                                            <td className="px-5 py-4 text-center">
                                                {p.totalOtHours > 0 ? (
                                                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-black bg-sky-50 text-sky-600 border border-sky-100">
                                                        {p.totalOtHours}H
                                                    </span>
                                                ) : (
                                                    <span className="text-[#cbd5e1] font-medium">—</span>
                                                )}
                                            </td>

                                            {/* 5 — OT Pay */}
                                            <td className="px-5 py-4 text-center">
                                                {p.totalOtHours > 0 ? (
                                                    <span className="font-bold text-sky-600 text-[13px] tabular-nums">{fmt(p.otPay)}</span>
                                                ) : (
                                                    <span className="text-[#cbd5e1]">—</span>
                                                )}
                                            </td>

                                            {/* 6 — Penalty (H) */}
                                            <td className="px-5 py-4 text-center">
                                                {p.totalAbsentDays > 0 ? (
                                                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-600 border border-rose-100">
                                                        {(p.totalAbsentDays * 8).toFixed(1)}H
                                                    </span>
                                                ) : (
                                                    <span className="text-[#cbd5e1] font-medium">—</span>
                                                )}
                                            </td>

                                            {/* 7 — Deduct (absent only) */}
                                            <td className="px-5 py-4 text-center">
                                                {p.absentDeduction > 0 ? (
                                                    <span className="font-bold text-rose-600 text-[13px] tabular-nums">-{fmt(p.absentDeduction)}</span>
                                                ) : (
                                                    <span className="text-[#cbd5e1]">—</span>
                                                )}
                                            </td>

                                            {/* 8 — Net Salary */}
                                            <td className="px-5 py-4 text-center">
                                                <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-black text-[13px] tabular-nums">
                                                    {fmt(p.netSalary)}
                                                </div>
                                                <div className="text-[10px] text-[#94a3b8] font-bold mt-1">
                                                    PIT {taxPct}% · INS {insPct}%
                                                </div>
                                            </td>

                                            {/* 9 — Status */}
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${p.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                    p.status === "PAID" ? "bg-sky-50 text-sky-700 border-sky-100" :
                                                        p.status === "CANCELLED" ? "bg-rose-50 text-rose-700 border-rose-100" :
                                                            "bg-slate-50 text-slate-600 border-slate-200"
                                                    }`}>
                                                    {p.status}
                                                </span>
                                            </td>

                                            {/* 10 — Actions */}
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    {p.status === "DRAFT" && !isPeriodClosed && (
                                                        <button onClick={() => setEditingPayslip(p)}
                                                            title="Edit details"
                                                            className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-all shadow-sm border border-amber-100 flex items-center justify-center">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                    )}
                                                    {p.status === "DRAFT" && !isPeriodClosed && (
                                                        <button onClick={() => handleConfirm(p.payslipId)} disabled={actionBusy !== null}
                                                            title="Approve"
                                                            className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-100 flex items-center justify-center">
                                                            {Icon.check}
                                                        </button>
                                                    )}
                                                    {p.status !== "PAID" && p.status !== "CANCELLED" && !isPeriodClosed && (
                                                        <button onClick={() => handleCancel(p.payslipId)} disabled={actionBusy !== null}
                                                            title="Cancel payslip"
                                                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-rose-100 flex items-center justify-center">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    )}
                                                    {(p.status === "PAID" || p.status === "CANCELLED" || isPeriodClosed) && p.status !== "DRAFT" && (
                                                        <span className="text-[#cbd5e1] font-bold text-lg">—</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Bar */}
                {payslips.length > 0 && (
                    <div className="border-t border-[#e2e8f0] bg-[#f8fafc] p-5 flex flex-wrap justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-white border border-[#e2e8f0] px-3 py-1.5 rounded-lg flex items-center gap-3 shadow-sm">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-[#166534]">
                                    <span className="w-2 h-2 rounded-full bg-[#10b981]"></span> {metrics.confirmed} Confirmed
                                </span>
                                <span className="w-px h-3 bg-[#e2e8f0]"></span>
                                <span className="flex items-center gap-1.5 text-xs font-medium text-[#64748b]">
                                    <span className="w-2 h-2 rounded-full bg-[#cbd5e1]"></span> {metrics.draft} Draft
                                </span>
                            </div>
                            <div className="text-sm">
                                <span className="text-[#64748b] font-medium mr-2">Total Payroll (Net):</span>
                                <span className="font-bold text-[#0f172a] text-lg">{fmt(payslips.reduce((a, b) => a + (b.status === 'CANCELLED' ? 0 : b.netSalary), 0))}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {!isPeriodClosed && metrics.draft > 0 && (
                                <button onClick={handleConfirmAll} disabled={actionBusy === "confirmAll" || batchStatus === "LOCKED"}
                                    className="px-5 py-2.5 bg-white border border-[#e2e8f0] hover:bg-[#10b981] hover:text-white hover:border-[#10b981] text-[#0f172a] rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-2">
                                    {Icon.check} {actionBusy === "confirmAll" ? "Processing..." : "Approve All Pending"}
                                </button>
                            )}
                            {!isPeriodClosed && metrics.confirmed > 0 && metrics.draft === 0 && (
                                <button onClick={handleSendToFinance} disabled={actionBusy === "sendFinance" || (batchStatus !== "VALIDATED" && batchStatus !== "PROCESSED")}
                                    className="px-6 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-2">
                                    {Icon.wallet} {actionBusy === "sendFinance" ? "Sending..." : "Submit to Finance"}
                                </button>
                            )}
                            {!isPeriodClosed && (metrics.emp > 0 && metrics.draft === 0 && payslips.every(p => p.status === "PAID" || p.status === "CANCELLED")) && (
                                <button onClick={handleClosePeriod} disabled={actionBusy === "closePeriod"}
                                    className="px-6 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50">
                                    {actionBusy === "closePeriod" ? "Closing..." : "Close Payroll Period"}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Payment Request History Panel ── */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden mb-6">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Finance Payment Responses
                        </h3>
                        <p className="text-xs text-[#64748b] mt-0.5 ml-7">Track Finance's decisions on your payment requests</p>
                    </div>
                    <button
                        onClick={() => {
                            if (!showHistory) loadPaymentHistory();
                            setShowHistory(v => !v);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#4f46e5] bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                        {showHistory ? "Hide" : "View Responses"}
                        <svg className={`w-4 h-4 transition-transform ${showHistory ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* Collapsible body */}
                {showHistory && (
                    <div className="p-5">
                        {historyLoad ? (
                            <div className="flex justify-center items-center py-10">
                                <div className="w-7 h-7 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : paymentHistory.length === 0 ? (
                            <div className="py-10 text-center text-[#94a3b8]">
                                <svg className="w-10 h-10 mx-auto text-[#cbd5e1] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm font-semibold">No payment requests sent yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {paymentHistory.map(req => {
                                    const prStatus = PR_STATUS_CFG[req.status] ?? PR_STATUS_CFG.PENDING;
                                    const isRejected = req.status === "REJECTED";
                                    const isPaid = req.status === "PAID";
                                    return (
                                        <div key={req.requestId}
                                            className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-start gap-4 transition-all ${isRejected ? "bg-rose-50/60 border-rose-200" :
                                                isPaid ? "bg-emerald-50/60 border-emerald-200" :
                                                    "bg-slate-50 border-[#e2e8f0]"
                                                }`}>
                                            {/* Left: status dot */}
                                            <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${prStatus.dot}`} />

                                            {/* Middle: info */}
                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[11px] font-mono text-[#64748b]">
                                                        #{req.requestId.substring(0, 8)}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${prStatus.bg} ${prStatus.text} ${prStatus.border}`}>
                                                        {prStatus.label}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-[#334155] bg-slate-100 px-2 py-0.5 rounded">
                                                        {PR_TYPE_LABEL[req.type] ?? req.type}
                                                    </span>
                                                    <span className="text-[11px] font-black text-[#0f172a] tabular-nums">
                                                        {fmt(req.totalAmountRequested)}
                                                    </span>
                                                    {req.createdAt && (
                                                        <span className="text-[10px] text-[#94a3b8]">
                                                            Sent: {new Date(req.createdAt).toLocaleDateString("en-US")}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* HR Note */}
                                                {req.hrNote && (
                                                    <p className="text-xs text-[#64748b]">
                                                        <span className="font-bold text-[#334155]">Your note:</span> {req.hrNote}
                                                    </p>
                                                )}

                                                {/* Finance feedback */}
                                                {req.financeNote ? (
                                                    <div className={`flex items-start gap-2 mt-2 p-3 rounded-lg border ${isRejected
                                                        ? "bg-rose-100/70 border-rose-200"
                                                        : "bg-emerald-100/70 border-emerald-200"
                                                        }`}>
                                                        <div className={`flex-shrink-0 mt-0.5 ${isRejected ? "text-rose-600" : "text-emerald-600"
                                                            }`}>
                                                            {isRejected ? (
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className={`text-[10px] font-black uppercase tracking-wide mb-0.5 ${isRejected ? "text-rose-700" : "text-emerald-700"
                                                                }`}>Finance Response:</p>
                                                            <p className="text-sm text-[#1e293b] font-medium">{req.financeNote}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    req.status === "PENDING" && (
                                                        <p className="text-xs text-[#94a3b8] italic mt-1">Awaiting Finance review...</p>
                                                    )
                                                )}
                                            </div>

                                            {/* Right: approved date */}
                                            {req.approvedAt && (
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wide">Processed</p>
                                                    <p className="text-xs font-semibold text-[#334155]">{new Date(req.approvedAt).toLocaleDateString("en-US")}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showCreate && <CreatePeriodModal onCreated={() => { setShowCreate(false); loadPeriods(); }} onClose={() => setShowCreate(false)} />}
            {showInquiries && <HRInquiriesModal onClose={() => setShowInquiries(false)} onRefreshCount={loadInquiryCount} />}
            {editingPayslip && (
                <EditPayslipDetailsModal
                    payslip={editingPayslip}
                    onClose={() => setEditingPayslip(null)}
                    onSaved={(updated) => {
                        setPayslips(prev => prev.map(p => p.payslipId === updated.payslipId ? updated : p));
                        setEditingPayslip(null);
                    }}
                />
            )}
        </div>
    );
};

export default HRPayrollView;
