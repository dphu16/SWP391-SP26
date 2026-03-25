import React, { useState, useEffect } from "react";
import { getMyTotalRewardStatement, type TotalRewardStatementDTO } from "../../services/payrollService";

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

const BENEFIT_TYPE_EMOJI: Record<string, React.ReactNode> = {
    ALLOWANCE: BenefitIcons.money, HEALTH_CARE: BenefitIcons.medical, LEARNING: BenefitIcons.book,
    GYM: BenefitIcons.gym, TRANSPORTATION: BenefitIcons.car, MEALS: BenefitIcons.food, OTHER: BenefitIcons.gift,
};

// ─── Stacked Bar Chart ─────────────────────────────────────────────────────────
const StackedBar: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return null;
    return (
        <div className="space-y-3">
            <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
                {data.map((d, i) => (
                    <div key={i} style={{ width: `${(d.value / total) * 100}%` }}
                        className={`${d.color} transition-all duration-700 first:rounded-l-full last:rounded-r-full`}
                        title={`${d.label}: ${fmt(d.value)}`} />
                ))}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-sm ${d.color}`} />
                        <span className="text-xs text-slate-600 font-medium">{d.label}</span>
                        <span className="text-xs font-bold text-slate-800 tabular-nums">{((d.value / total) * 100).toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const EmployeeTRSView: React.FC = () => {
    const [trs, setTrs] = useState<TotalRewardStatementDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); setErr(""); setTrs(null);
            try {
                const data = await getMyTotalRewardStatement(year);
                setTrs(data);
            } catch (e) { setErr(getErrMsg(e)); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [year]);

    const chartData = trs ? [
        { label: "Net Salary", value: trs.totalNetSalary, color: "bg-emerald-500" },
        { label: "Cash Allowances", value: trs.totalCashAllowances, color: "bg-sky-400" },
        { label: "Tax & Insurance", value: (trs.totalTaxPaid ?? 0) + (trs.totalInsurancePaid ?? 0), color: "bg-amber-400" },
        { label: "Non-cash Benefits", value: trs.totalNonCashBenefitsValue, color: "bg-violet-400" },
    ].filter(d => d.value > 0) : [];

    return (
        <div className="flex flex-col pb-10 w-full relative z-0">
            {/* Summary Top Area */}
            <div className="bg-white rounded-[14px] border border-slate-200/60 p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
                
                <div className="relative z-10">
                    <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Total Reward Statement
                    </p>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">
                        {loading ? "Loading..." : trs ? `Review Period: ${trs.period}` : "My Benefits"}
                    </h2>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                        {trs && (
                            <>
                                <span className="flex items-center gap-1.5"><code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">{trs.employeeCode}</code></span>
                                <span className="text-slate-300">•</span>
                                <span>{trs.employeeName}</span>
                            </>
                        )}
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-wider text-slate-400">Select Year</span>
                            <select value={year} onChange={e => setYear(Number(e.target.value))}
                                className="px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded-md text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm  font-semibold">
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {trs && (
                    <div className="relative z-10 flex-shrink-0 text-right bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Grand Total Reward Value</p>
                        <div className="flex items-baseline justify-end gap-1.5">
                            <p className="text-[32px] font-black text-emerald-600 tracking-tight leading-none">
                                {fmt(trs.grandTotalRewardValue).replace(/\s₫/g, "")}
                            </p>
                            <span className="text-sm font-bold text-emerald-600/60">₫</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Error State */}
            {err && (
                <div className="p-4 mb-6 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-sm flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                    {err}
                </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 h-48 animate-pulse" />
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 h-48 animate-pulse" />
                </div>
            )}

            {trs && (
                <>
                    {/* Visual breakdown */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
                        <h3 className="text-base font-bold text-slate-900 mb-1">Total Reward Composition</h3>
                        <p className="text-xs text-slate-500 mb-5">Breakdown of each component in your total annual rewards</p>
                        <StackedBar data={chartData} />
                    </div>

                    {/* Breakdown Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                        {[
                            { label: "Gross Salary", value: trs.totalGrossSalary, emoji: Icon.layers, bgWrapper: "bg-slate-50/50 border-slate-200/60", iconBg: "bg-slate-100 border-slate-200 text-slate-500", textColor: "text-slate-800" },
                            { label: "Cash Allowances", value: trs.totalCashAllowances, emoji: BenefitIcons.money, bgWrapper: "bg-sky-50/50 border-sky-200/60", iconBg: "bg-sky-100 border-sky-200 text-sky-500", textColor: "text-sky-800" },
                            { label: "Tax & Insurance", value: (trs.totalTaxPaid ?? 0) + (trs.totalInsurancePaid ?? 0), emoji: Icon.shield, bgWrapper: "bg-amber-50/50 border-amber-200/60", iconBg: "bg-amber-100 border-amber-200 text-amber-500", textColor: "text-amber-800" },
                            { label: "Hidden Rewards", value: trs.totalNonCashBenefitsValue, emoji: BenefitIcons.gift, bgWrapper: "bg-violet-50/50 border-violet-200/60", iconBg: "bg-violet-100 border-violet-200 text-violet-500", textColor: "text-violet-800" },
                        ].map((item, i) => (
                            <div key={i} className={`bg-white rounded-[14px] border ${item.bgWrapper} p-5 shadow-sm relative overflow-hidden flex flex-col justify-center`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${item.iconBg} shrink-0`}>
                                        {item.emoji}
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide leading-tight">{item.label}</p>
                                </div>
                                <div className="flex items-baseline gap-1.5 mt-auto">
                                    <p className={`text-[22px] font-black ${item.textColor} tracking-tight leading-none`}>
                                        {fmt(item.value).replace(/\s₫/g, "")}
                                    </p>
                                    <span className={`text-xs font-bold ${item.textColor} opacity-60`}>₫</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Non-cash Benefits Detail */}
                    {(trs.benefitItems?.length ?? 0) > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-violet-50/50">
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <span className="text-violet-500">{BenefitIcons.gift}</span> Non-cash Benefits Detail
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 ml-6">Additional value provided by the company as part of your total package</p>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {trs.benefitItems.map((item, i) => (
                                    <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-500">{BENEFIT_TYPE_EMOJI[item.benefitType] ?? BenefitIcons.gift}</span>
                                            <div>
                                                <p className="font-semibold text-slate-800 text-sm">{item.benefitName}</p>
                                                <p className="text-xs text-slate-400">{item.benefitType}</p>
                                            </div>
                                        </div>
                                        <p className="font-black text-violet-700 tabular-nums text-sm">{fmt(item.calculatedValue)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 py-4 bg-violet-50/50 border-t border-violet-100 flex justify-between items-center">
                                <p className="text-sm font-bold text-violet-800">Total Hidden Rewards</p>
                                <p className="text-lg font-black text-violet-700 tabular-nums">{fmt(trs.totalNonCashBenefitsValue)}</p>
                            </div>
                        </div>
                    )}

                    {/* Empty benefits state */}
                    {(trs.benefitItems?.length ?? 0) === 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 flex flex-col items-center justify-center">
                            <div className="text-slate-300 mb-4 scale-150">{BenefitIcons.gift}</div>
                            <p className="text-sm font-semibold text-slate-500">No non-cash benefits found for year {year}.</p>
                            <p className="text-xs text-slate-400 mt-1">Contact HR for information about available benefit packages.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default EmployeeTRSView;
