import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "./PayrollModule";
import {
    getMyPayslips, getMyPayslipDetail, createInquiry, getMyInquiries, downloadPayslipPdf,
    type PayslipResponse, type SalaryInquiryDto, type CreateSalaryInquiryRequest,
} from "../../services/payrollService";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n?: number | null) =>
    n == null ? "0 ₫" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const getErrMsg = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } | string } };
    return typeof err?.response?.data === "string"
        ? err.response.data
        : (err?.response?.data as { message?: string })?.message ?? "An error occurred, please try again.";
};

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
function StatusBadge({ status, cfg }: { status: string; cfg: typeof PAYSLIP_STATUS }) {
    const c = cfg[status] ?? cfg[Object.keys(cfg)[0]];
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.text} ${c.bg} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

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
        if (!subject.trim() || !message.trim()) { setErr("Please enter a subject and message."); return; }
        setBusy(true); setErr("");
        try {
            const req: CreateSalaryInquiryRequest = { payslipId: payslipId ?? null, subject: subject.trim(), message: message.trim() };
            await createInquiry(req);
            onDone(); onClose();
        } catch (e) {
            setErr(getErrMsg(e));
        } finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <span className="text-white">{Icon.help}</span>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Submit a Salary Inquiry</h3>
                            <p className="text-xs text-slate-500">HR will respond within 1-2 business days</p>
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
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Subject <span className="text-rose-500">*</span></label>
                        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="E.g. Incorrect OT hours for January..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Message <span className="text-rose-500">*</span></label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                            placeholder="Describe your inquiry in detail..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors resize-none" />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} disabled={busy} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-white transition-colors cursor-pointer disabled:opacity-50">Cancel</button>
                    <button onClick={submit} disabled={busy}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer disabled:opacity-60">
                        {busy ? "Sending..." : "Submit Inquiry"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const EmployeePayrollView: React.FC = () => {
    const [list, setList] = useState<PayslipResponse[]>([]);
    const [selId, setSelId] = useState<string | null>(null);
    const [detail, setDetail] = useState<PayslipResponse | null>(null);
    const [inquiries, setInqList] = useState<SalaryInquiryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDL] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<"payslip" | "inquiries">("payslip");
    const [showModal, setShowModal] = useState(false);

    // Load payslip list
    const loadList = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const data = await getMyPayslips();
            setList(data);
            if (data.length > 0) setSelId(data[0].payslipId);
        } catch (e: unknown) {
            const err = e as { response?: { status?: number; data?: { message?: string } } };
            const status = err?.response?.status;
            setError(
                status === 401 ? "Session expired. Please log in again." :
                    status === 403 ? "You do not have permission to view salary data." :
                        `Failed to load data (${status ?? "network"}): ${err?.response?.data?.message ?? "Unknown error"}`
            );
        } finally { setLoading(false); }
    }, []);

    // Load inquiries
    const loadInquiries = useCallback(async () => {
        try {
            const data = await getMyInquiries();
            setInqList(data);
        } catch { /* silent */ }
    }, []);

    // Load detail
    const loadDetail = useCallback(async (id: string) => {
        setDL(true);
        try {
            const d = await getMyPayslipDetail(id);
            setDetail(d);
        } catch { setDetail(null); }
        finally { setDL(false); }
    }, []);

    useEffect(() => { loadList(); loadInquiries(); }, [loadList, loadInquiries]);
    useEffect(() => { if (selId) loadDetail(selId); }, [selId, loadDetail]);

    const incomeItems = detail?.details?.filter(i => i.type === "ALLOWANCE") ?? [];
    const deductItems = detail?.details?.filter(i => i.type === "DEDUCTION") ?? [];
    const grossSalary = detail?.grossSalary ?? 0;
    const netSalary = detail?.netSalary ?? 0;
    const totalDeduct = detail?.totalDeductions ?? 0;
    const netPct = grossSalary > 0 ? Math.round((netSalary / grossSalary) * 100) : 0;
    const deductPct = grossSalary > 0 ? Math.round((totalDeduct / grossSalary) * 100) : 0;

    const handleDownloadPdf = async () => {
        if (!selId) return;
        try {
            const blob = await downloadPayslipPdf(selId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Payslip_${detail?.month}_${detail?.year}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            alert(getErrMsg(e));
        }
    };

    const handlePrint = () => {
        if (!detail) return;
        const d = detail;
        const netPctVal = d.grossSalary > 0 ? Math.round((d.netSalary / d.grossSalary) * 100) : 0;
        const incItems = d.details?.filter(i => i.type === "ALLOWANCE") ?? [];
        const deItems  = d.details?.filter(i => i.type === "DEDUCTION") ?? [];

        const row = (label: string, value: string, color = "#1e293b", indent = false) =>
            `<tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 16px;font-size:13px;color:#64748b;${indent ? 'padding-left:32px' : ''}">${label}</td>
                <td style="padding:10px 16px;font-size:13px;font-weight:700;color:${color};text-align:right;font-variant-numeric:tabular-nums">${value}</td>
            </tr>`;

        const sectionHeader = (label: string, color: string, bg: string) =>
            `<tr style="background:${bg}">
                <td colspan="2" style="padding:8px 16px">
                    <div style="display:flex;align-items:center;gap:8px">
                        <div style="width:8px;height:8px;border-radius:50%;background:${color}"></div>
                        <span style="font-size:11px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:.08em">${label}</span>
                    </div>
                </td>
            </tr>`;

        const STATUS_EN: Record<string, string> = {
            DRAFT: "Draft", CONFIRMED: "Confirmed", PAID: "Paid", CANCELLED: "Cancelled"
        };

        const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Payslip - Month ${d.month}/${d.year}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #1e293b; }
  @page { size: A4; margin: 18mm 14mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  .wrapper { max-width: 720px; margin: 0 auto; padding: 0; }
  .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: #fff; padding: 28px 32px; border-radius: 12px 12px 0 0; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .company-name { font-size: 22px; font-weight: 900; letter-spacing: -.5px; }
  .payslip-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; opacity: .7; margin-bottom: 4px; }
  .period-text { font-size: 18px; font-weight: 800; letter-spacing: -.3px; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25); margin-top: 8px; }
  .employee-bar { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px 32px; display: flex; gap: 48px; }
  .emp-field label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; }
  .emp-field .value { font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 2px; }
  .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-bottom: 1px solid #e2e8f0; }
  .kpi-card { padding: 20px 24px; border-right: 1px solid #e2e8f0; }
  .kpi-card:last-child { border-right: none; }
  .kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: 4px; }
  .kpi-value { font-size: 18px; font-weight: 900; letter-spacing: -.5px; }
  .progress-bar-wrap { padding: 16px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .progress-bar-track { height: 8px; background: #e2e8f0; border-radius: 99px; overflow: hidden; display: flex; }
  .progress-bar-net { height: 100%; background: #10b981; }
  .progress-bar-ded { height: 100%; background: #f87171; }
  .progress-legend { display: flex; gap: 16px; margin-top: 8px; font-size: 11px; color: #94a3b8; }
  .legend-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
  table { width: 100%; border-collapse: collapse; }
  .section-total td { font-weight: 800; }
  .net-row { background: linear-gradient(90deg, #ecfdf5 0%, #f8fafc 100%); border-top: 2px solid #6ee7b7; }
  .net-row td { padding: 18px 16px; }
  .net-label { font-size: 14px; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: .05em; }
  .net-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .net-amount { font-size: 22px; font-weight: 900; color: #059669; }
  .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; border-radius: 0 0 12px 12px; display: flex; justify-content: space-between; }
  .sig-box { text-align: center; }
  .sig-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #64748b; margin-bottom: 48px; }
  .sig-line { border-top: 1px solid #cbd5e1; width: 140px; margin: 0 auto; padding-top: 6px; font-size: 11px; color: #94a3b8; }
  .print-btn { display: block; margin: 24px auto 0; padding: 12px 32px; background: #1e293b; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
</style>
</head>
<body>
<div class="wrapper">
  <!-- Header -->
  <div class="header">
    <div class="header-top">
      <div>
        <div class="company-name">HRM System</div>
        <div style="font-size:12px;opacity:.6;margin-top:2px">Human Resource Management</div>
      </div>
      <div style="text-align:right">
        <div class="payslip-label">Pay Slip</div>
        <div class="period-text">Month ${String(d.month).padStart(2,'0')}/${d.year}</div>
        <div class="status-badge">${STATUS_EN[d.status] ?? d.status}</div>
      </div>
    </div>
  </div>

  <!-- Employee info -->
  <div class="employee-bar">
    <div class="emp-field"><label>Employee</label><div class="value">${d.employeeName}</div></div>
    <div class="emp-field"><label>Department</label><div class="value">${d.departmentName || '—'}</div></div>
    <div class="emp-field"><label>Confirmed Date</label><div class="value">${d.confirmedAt ? fmtDate(d.confirmedAt) : '—'}</div></div>
    <div class="emp-field"><label>Paid Date</label><div class="value">${d.paidAt ? fmtDate(d.paidAt) : 'Not Paid'}</div></div>
  </div>

  <!-- KPI Row -->
  <div class="kpi-row">
    <div class="kpi-card"><div class="kpi-label">Gross Salary</div><div class="kpi-value" style="color:#1e293b">${fmt(d.grossSalary)}</div></div>
    <div class="kpi-card"><div class="kpi-label">Total Deductions</div><div class="kpi-value" style="color:#dc2626">-${fmt(d.totalDeductions)}</div></div>
    <div class="kpi-card"><div class="kpi-label">Net Salary</div><div class="kpi-value" style="color:#059669">${fmt(d.netSalary)}</div></div>
  </div>

  <!-- Progress bar -->
  <div class="progress-bar-wrap">
    <div class="progress-bar-track">
      <div class="progress-bar-net" style="width:${netPctVal}%"></div>
      <div class="progress-bar-ded" style="width:${100 - netPctVal}%"></div>
    </div>
    <div class="progress-legend">
      <span><span class="legend-dot" style="background:#10b981"></span>${netPctVal}% Net Salary</span>
      <span><span class="legend-dot" style="background:#f87171"></span>${100 - netPctVal}% Deductions</span>
    </div>
  </div>

  <!-- Detail table -->
  <table>
    <tbody>
      ${sectionHeader('Income', '#059669', '#f0fdf4')}
      ${row('Base Salary', '+' + fmt(d.baseSalary), '#059669')}
      ${d.totalOtHours > 0 ? row(`Overtime (${d.totalOtHours}h)`, '+' + fmt(d.otPay), '#059669') : ''}
      ${d.totalAllowances > 0 ? row('Allowances', '+' + fmt(d.totalAllowances), '#059669') : ''}
      ${incItems.map(i => row('↳ ' + i.itemName, '+' + fmt(i.amount), '#059669', true)).join('')}
      <tr style="background:#f0fdf4;border-top:1px solid #d1fae5" class="section-total">
        <td style="padding:10px 16px;font-size:13px;font-weight:800;color:#065f46">Total Income</td>
        <td style="padding:10px 16px;font-size:13px;font-weight:800;color:#065f46;text-align:right">${fmt(d.grossSalary)}</td>
      </tr>

      ${sectionHeader('Deductions', '#dc2626', '#fff1f2')}
      ${d.totalAbsentDays > 0 ? row(`Absent Deduction (${d.totalAbsentDays} days)`, '-' + fmt(d.absentDeduction), '#dc2626') : ''}
      ${row('Tax (PIT)', '-' + fmt(d.taxAmount), '#dc2626')}
      ${row('Insurance (BHXH+BHYT+BHTN — 10.5%)', '-' + fmt(d.insuranceAmount), '#dc2626')}
      ${deItems.map(i => row('↳ ' + i.itemName, '-' + fmt(i.amount), '#dc2626', true)).join('')}
      <tr style="background:#fff1f2;border-top:1px solid #fecaca" class="section-total">
        <td style="padding:10px 16px;font-size:13px;font-weight:800;color:#991b1b">Total Deductions</td>
        <td style="padding:10px 16px;font-size:13px;font-weight:800;color:#991b1b;text-align:right">-${fmt(d.totalDeductions)}</td>
      </tr>

      <!-- Net row -->
      <tr class="net-row">
        <td><div class="net-label">Net Salary</div><div class="net-sub">${d.paidAt ? 'Paid: ' + fmtDate(d.paidAt) : 'Not Paid Yet'}</div></td>
        <td style="text-align:right;vertical-align:middle"><span class="net-amount">${fmt(d.netSalary)}</span></td>
      </tr>
    </tbody>
  </table>

  <!-- Signature footer -->
  <div class="footer">
    <div class="sig-box">
      <div class="sig-label">Employee Signature</div>
      <div class="sig-line">${d.employeeName}</div>
    </div>
    <div style="text-align:center;font-size:11px;color:#94a3b8;align-self:flex-end">
      Printed: ${new Date().toLocaleString('en-US')}
    </div>
    <div class="sig-box">
      <div class="sig-label">HR Department Head</div>
      <div class="sig-line">Signature &amp; Stamp</div>
    </div>
  </div>

  <button class="print-btn no-print" onclick="window.print()">🖨️ Print Payslip</button>
</div>
</body>
</html>`;

        const win = window.open("", "_blank", "width=800,height=900");
        if (!win) { alert("Popup blocked. Please allow popups."); return; }
        win.document.write(html);
        win.document.close();
        win.focus();
    };

    if (loading) return <Skeleton />;

    if (error) return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mb-4">
                <span className="text-rose-500 scale-125">{Icon.warning}</span>
            </div>
            <h3 className="text-lg font-bold text-rose-700 mb-2">Unable to Load Data</h3>
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
            <h3 className="text-lg font-bold text-slate-700 mb-2">No payslips yet</h3>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                Payslips will appear here once HR completes salary calculation and confirms the payroll period.
            </p>
        </div>
    );

    return (
        <>
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-5 print:hidden">
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
                    {/* ── Period + actions bar ─────── */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 mb-5 print:hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-slate-400">{Icon.calendar}</span>
                                <label htmlFor="period-select" className="text-sm font-semibold text-slate-700">Payroll Period:</label>
                                <div className="relative">
                                    <select id="period-select" value={selId ?? ""} onChange={e => setSelId(e.target.value)}
                                        className="appearance-none pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer min-w-[220px] hover:border-emerald-300 transition-colors">
                                        {list.map(p => (
                                            <option key={p.payslipId} value={p.payslipId}>
                                                Month {String(p.month).padStart(2, "0")}/{p.year} — {fmt(p.netSalary)}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">{Icon.chevronDown}</span>
                                </div>
                                {detail && <StatusBadge status={detail.status} cfg={PAYSLIP_STATUS} />}
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleDownloadPdf}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer">
                                    {Icon.download}<span className="hidden lg:inline">Export PDF</span>
                                </button>
                                <button onClick={handlePrint}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">
                                    {Icon.print}<span className="hidden lg:inline">Print</span>
                                </button>
                                <button onClick={() => setShowModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer shadow-sm">
                                    {Icon.help}<span className="hidden lg:inline">Inquiry</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Payslip Detail ─────────────── */}
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
                                    <p className="text-xs text-slate-400">Before deductions</p>
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
                                        <p className="text-xs text-slate-400">Tax (PIT): <span className="font-medium text-slate-600">{fmt(detail.taxAmount)}</span></p>
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
                                        {detail.paidAt ? `Paid: ${fmtDate(detail.paidAt)}` : "Not paid yet"}
                                    </p>
                                </div>
                            </div>

                            {/* Salary distribution bar */}
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                                <div className="flex justify-between text-xs text-slate-500 mb-2">
                                    <span>Salary breakdown</span>
                                    <span>{netPct}% net</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                                    <div className="h-full bg-emerald-400 rounded-l-full transition-all duration-700" style={{ width: `${netPct}%` }} />
                                    <div className="h-full bg-rose-300 transition-all duration-700" style={{ width: `${deductPct}%` }} />
                                </div>
                                <div className="flex gap-4 mt-2 text-xs text-slate-400">
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Net Salary</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-300" />Deductions</span>
                                </div>
                            </div>

                            {/* Detail table */}
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">Payslip Details</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Month {detail.month}/{detail.year}
                                        </p>
                                    </div>
                                    <StatusBadge status={detail.status} cfg={PAYSLIP_STATUS} />
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Line Item</th>
                                                <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Amount (VND)</th>
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
                                            {(detail.otPay ?? 0) > 0 && (
                                                <tr className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3.5 font-medium text-slate-700">Overtime ({detail.totalOtHours}h)</td>
                                                    <td className="px-6 py-3.5 text-right font-semibold text-emerald-600">+{fmt(detail.otPay)}</td>
                                                </tr>
                                            )}
                                            {(detail.totalAllowances ?? 0) > 0 && (
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
                                            {(detail.absentDeduction ?? 0) > 0 && (
                                                <tr className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3.5 font-medium text-slate-700">Absent Deduction ({detail.totalAbsentDays} days)</td>
                                                    <td className="px-6 py-3.5 text-right font-semibold text-rose-600">-{fmt(detail.absentDeduction)}</td>
                                                </tr>
                                            )}
                                            <tr className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-3.5 font-medium text-slate-700">Tax (PIT)</td>
                                                <td className="px-6 py-3.5 text-right font-semibold text-rose-600">-{fmt(detail.taxAmount)}</td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-3.5 font-medium text-slate-700">Insurance (BHXH + BHYT + BHTN — 10.5%)</td>
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
                                                    <p className="text-sm font-bold text-slate-800">NET SALARY</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{detail.paidAt ? `Paid date: ${fmtDate(detail.paidAt)}` : "Not paid yet"}</p>
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
                /* ── Inquiries Tab ───── */
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Inquiry History</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{inquiries.length} inquiries submitted</p>
                        </div>
                        <button onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 cursor-pointer">
                            {Icon.help} New Inquiry
                        </button>
                    </div>

                    {inquiries.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">{Icon.inbox}</div>
                            <p className="text-sm font-semibold text-slate-600">No inquiries yet</p>
                            <p className="text-xs text-slate-400 mt-1">You have not submitted any salary inquiries yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {inquiries.map(inq => (
                                <div key={inq.id} className="px-6 py-4 hover:bg-slate-50/60 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{inq.subject}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{inq.message}</p>
                                            {inq.hrResponse && (
                                                <div className="mt-3 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-0.5">
                                                        HR Response ({inq.hrResponse.responderName}):
                                                    </p>
                                                    <p className="text-xs text-slate-700">{inq.hrResponse.officialResponse}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <StatusBadge status={inq.status} cfg={INQUIRY_STATUS} />
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
