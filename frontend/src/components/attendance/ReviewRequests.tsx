import React, { useState } from "react";

type AppStatus = "Pending" | "Approved" | "Rejected";
type AppType = "Annual Leave" | "Overtime" | "Change Shift" | "Sick Leave";

interface ReviewEntry {
    id: number;
    initials: string;
    avatarColor: string;
    employeeName: string;
    position: string;
    appType: AppType;
    dateRequested: string;
    details: string;
    sub: string;
    status: AppStatus;
}

const MOCK_DATA: ReviewEntry[] = [
    { id: 1, initials: "JD", avatarColor: "#a78bfa", employeeName: "John Doe", position: "UX Designer", appType: "Annual Leave", dateRequested: "Oct 24, 2023", details: "Oct 30 - Nov 02", sub: "4 Days", status: "Pending" },
    { id: 2, initials: "SM", avatarColor: "#f48c57", employeeName: "Sarah Miller", position: "Product Manager", appType: "Overtime", dateRequested: "Oct 24, 2023", details: "Today, 6pm-8pm", sub: "2 Hours", status: "Pending" },
    { id: 3, initials: "MR", avatarColor: "#60a5fa", employeeName: "Mike Ross", position: "Junior Developer", appType: "Change Shift", dateRequested: "Oct 23, 2023", details: "Swap with Harvey", sub: "Nov 01", status: "Pending" },
    { id: 4, initials: "EL", avatarColor: "#34d399", employeeName: "Emily Lewis", position: "HR Assistant", appType: "Sick Leave", dateRequested: "Oct 22, 2023", details: "Oct 22 - Oct 23", sub: "2 Days", status: "Pending" },
    { id: 5, initials: "AK", avatarColor: "#f472b6", employeeName: "Amy King", position: "Designer", appType: "Annual Leave", dateRequested: "Sep 15, 2023", details: "Sep 20 - Sep 22", sub: "3 Days", status: "Approved" },
    { id: 6, initials: "TP", avatarColor: "#facc15", employeeName: "Tom Parker", position: "Engineer", appType: "Overtime", dateRequested: "Sep 10, 2023", details: "Sep 12, 7pm-9pm", sub: "2 Hours", status: "Rejected" },
];

const typeIcon: Record<AppType, React.ReactNode> = {
    "Annual Leave": (
        <span className="w-8 h-8 rounded-lg bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </span>
    ),
    "Overtime": (
        <span className="w-8 h-8 rounded-lg bg-[#dcfce7] text-[#15803d] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </span>
    ),
    "Change Shift": (
        <span className="w-8 h-8 rounded-lg bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        </span>
    ),
    "Sick Leave": (
        <span className="w-8 h-8 rounded-lg bg-[#fef3c7] text-[#b45309] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        </span>
    ),
};

const ReviewRequests: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AppStatus>("Pending");
    const [entries, setEntries] = useState<ReviewEntry[]>(MOCK_DATA);

    const displayed = entries.filter(e => e.status === activeTab);
    const pendingCount = entries.filter(e => e.status === "Pending").length;

    const approve = (id: number) => setEntries(prev => prev.map(e => e.id === id ? { ...e, status: "Approved" } : e));
    const reject = (id: number) => setEntries(prev => prev.map(e => e.id === id ? { ...e, status: "Rejected" } : e));

    const tabs: { label: string; status: AppStatus; badge?: number }[] = [
        { label: "Pending", status: "Pending", badge: pendingCount },
        { label: "Approved", status: "Approved" },
        { label: "Rejected", status: "Rejected" },
    ];

    return (
        <div className="flex flex-col pb-10 max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">Application Review</h1>
                    <p className="text-[#64748b] text-[15px] mt-1">Review, approve, or reject incoming employee requests.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg text-sm font-medium text-[#334155] hover:bg-gray-50 shadow-sm transition-all">
                    <svg className="w-4 h-4 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    History
                </button>
            </div>

            {/* Panel */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-[#e2e8f0] px-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.status}
                            onClick={() => setActiveTab(tab.status)}
                            className={`relative flex items-center gap-2 py-4 px-2 mr-6 text-sm font-semibold transition-colors
                                ${activeTab === tab.status
                                    ? "text-[#0d9488] border-b-2 border-[#0d9488]"
                                    : "text-[#64748b] hover:text-[#334155]"
                                }`}
                        >
                            {tab.label}
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span className="ml-1 min-w-[20px] h-5 px-1.5 rounded-full bg-[#0d9488] text-white text-[10px] font-bold flex items-center justify-center">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[#e2e8f0]">
                                {["Employee Name", "Application Type", "Date Requested", "Details", "Action"].map(h => (
                                    <th key={h} className="px-5 py-3 text-xs font-bold text-[#94a3b8] uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1f5f9]">
                            {displayed.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-[#94a3b8] italic">
                                        No {activeTab.toLowerCase()} requests.
                                    </td>
                                </tr>
                            )}
                            {displayed.map(entry => (
                                <tr key={entry.id} className="hover:bg-[#f8fafc] transition-colors">
                                    {/* Employee */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                                style={{ background: entry.avatarColor }}
                                            >
                                                {entry.initials}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#1e293b] text-sm">{entry.employeeName}</p>
                                                <p className="text-xs text-[#94a3b8]">{entry.position}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Type */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2.5">
                                            {typeIcon[entry.appType]}
                                            <span className="text-sm font-semibold text-[#1e293b]">{entry.appType}</span>
                                        </div>
                                    </td>

                                    {/* Date */}
                                    <td className="px-5 py-4 text-sm text-[#475569]">{entry.dateRequested}</td>

                                    {/* Details */}
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-semibold text-[#1e293b]">{entry.details}</p>
                                        <p className="text-xs text-[#94a3b8]">{entry.sub}</p>
                                    </td>

                                    {/* Action */}
                                    <td className="px-5 py-4">
                                        {activeTab === "Pending" ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => approve(entry.id)}
                                                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => reject(entry.id)}
                                                    className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#fca5a5] bg-white hover:bg-[#fef2f2] text-[#dc2626] text-xs font-bold rounded-lg transition-all"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold
                                                ${activeTab === "Approved" ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#fee2e2] text-[#dc2626]"}`}>
                                                {activeTab}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-5 py-4 border-t border-[#f1f5f9]">
                    <p className="text-sm text-[#64748b]">
                        Showing <span className="font-bold text-[#0f172a]">1</span> to{" "}
                        <span className="font-bold text-[#0f172a]">{displayed.length}</span> of{" "}
                        <span className="font-bold text-[#0f172a]">{displayed.length}</span> {activeTab.toLowerCase()} requests
                    </p>
                    <div className="flex gap-2">
                        <button disabled className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-sm text-[#94a3b8] cursor-not-allowed">Previous</button>
                        <button disabled className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-sm text-[#94a3b8] cursor-not-allowed">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewRequests;
