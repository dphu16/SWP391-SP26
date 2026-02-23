import { useState, useEffect } from "react";
import { kpiService } from "../services/kpiService";

const TEAM_MEMBERS = [
    {
        id: 1,
        name: "Alex Rivera",
        status: "CURRENT SELECTION",
        avatar: "https://i.pravatar.cc/150?u=alex",
        score: null,
        statusType: "current",
    },
    {
        id: 2,
        name: "Jordan Smith",
        status: "COMPLETED",
        avatar: "https://i.pravatar.cc/150?u=jordan",
        score: 92,
        statusType: "completed",
    },
    {
        id: 3,
        name: "Sarah Chen",
        status: "EVIDENCE READY",
        avatar: "https://i.pravatar.cc/150?u=sarah",
        score: null,
        statusType: "ready",
    },
    {
        id: 4,
        name: "Marcus Wong",
        status: "NO SUBMISSION",
        avatar: "https://i.pravatar.cc/150?u=marcus",
        score: null,
        statusType: "none",
    },
];



const Icons = {
    checkCircle: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
    ),
    dotYellow: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-accent-amber">
            <circle cx="10" cy="10" r="3" />
        </svg>
    ),
    dotGray: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark">
            <circle cx="10" cy="10" r="3" />
        </svg>
    ),
    lock: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-text-muted-light dark:text-text-muted-dark inline-block ml-1">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
    ),
    documentText: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary">
            <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
        </svg>
    ),
    image: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary">
            <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a2.25 2.25 0 00-3.182 0l-1.44 1.439a2.25 2.25 0 01-3.182 0X8.06 10.06a2.25 2.25 0 00-3.182 0l-2.378 2.378zM14.75 6a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" clipRule="evenodd" />
        </svg>
    ),
    eye: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors cursor-pointer">
            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
    ),
    arrowRight: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary ml-1 inline-block">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
        </svg>
    )
};

const ManagerPerformance = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
    const [kpis, setKpis] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeamKpis = async () => {
            const deptsData = await kpiService.getAllDepartments();
            const allKpiLibs = await kpiService.getAllKpiLibraries();

            if (deptsData && deptsData.length > 0) {
                // Mock context: fetch assigned KPIs for the first department as "Manager's department"
                const activeDeptKpis = await kpiService.getKpisByDepartment(deptsData[0].deptId);

                if (activeDeptKpis && activeDeptKpis.length > 0) {
                    // map to full KPI info
                    const formatted = activeDeptKpis.map(detail => {
                        const def = allKpiLibs.find(k => k.libId === detail.kpiLibraryId);
                        return {
                            ...detail,
                            name: def?.name || "Unknown",
                            category: def?.category || "",
                            description: def?.description || "",
                        }
                    });
                    setKpis(formatted);
                } else {
                    setKpis([]); // Blank if none assigned
                }
            }
            setLoading(false);
        };
        fetchTeamKpis();
    }, []);

    return (
        <div className="flex flex-col h-full space-y-5">
            {/* Header section matches image */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight">
                        Performance Module
                    </h1>
                    <p className="mt-0.5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        Standardized KPI management and scoring workflow
                    </p>
                </div>
                <div className="flex items-center bg-surface-light dark:bg-surface-dark p-1 rounded-xl shadow-sm border border-border-light dark:border-border-dark">
                    <button
                        onClick={() => setActiveTab("hr")}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "hr"
                            ? "bg-surface-2-light dark:bg-surface-2-dark text-text-primary-light dark:text-text-primary-dark shadow-sm"
                            : "text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light"
                            }`}
                    >
                        HR Config
                    </button>
                    <button
                        onClick={() => setActiveTab("manager")}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "manager"
                            ? "bg-surface-light dark:bg-surface-dark text-primary shadow-sm"
                            : "text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light"
                            }`}
                    >
                        Manager Console
                    </button>
                </div>
            </div>

            <div className="flex gap-6 items-start">
                {/* Left Column (Main Content) */}
                <div className="flex-1 space-y-6">
                    {/* Top Stats Row */}
                    <div className="grid grid-cols-3 gap-5">
                        {/* Team Progress */}
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm bento-card">
                            <h3 className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-3">
                                Team Progress
                            </h3>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-3xl font-bold font-heading">8</span>
                                <span className="text-xl font-medium text-text-secondary-light dark:text-text-secondary-dark">/ 12</span>
                                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark ml-1">submitted</span>
                            </div>
                            <div className="h-2 w-full bg-surface-2-light dark:bg-surface-2-dark rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: "66%" }}></div>
                            </div>
                        </div>

                        {/* Average Score */}
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm bento-card">
                            <h3 className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-3">
                                Average Score
                            </h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold font-heading">84.2</span>
                                <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                    +5.2%
                                </span>
                            </div>
                        </div>

                        {/* Pending Review */}
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm bento-card">
                            <h3 className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-3">
                                Pending Review
                            </h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold font-heading">4</span>
                                <span className="text-sm font-medium text-accent-amber ml-1">High priority</span>
                            </div>
                        </div>
                    </div>

                    {/* Team KPI Overview Table */}
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-surface-light dark:bg-surface-dark">
                            <h2 className="text-lg font-bold font-heading text-text-primary-light dark:text-text-primary-dark">
                                Team KPI Overview: <span className="text-primary">Alex Rivera</span>
                            </h2>
                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md tracking-wider">
                                Q3 2023 PERIOD
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-light dark:border-border-dark bg-surface-2-light dark:bg-surface-2-dark">
                                        <th className="px-5 py-3 text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest w-2/5">
                                            Category
                                        </th>
                                        <th className="px-5 py-3 text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">
                                            Weighting (HR)
                                        </th>
                                        <th className="px-5 py-3 text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">
                                            Target Value
                                        </th>
                                        <th className="px-5 py-3 text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest text-right">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-4 text-center text-text-muted-light dark:text-text-muted-dark">
                                                Loading KPIs...
                                            </td>
                                        </tr>
                                    ) : kpis.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-4 text-center text-text-muted-light dark:text-text-muted-dark">
                                                No KPIs found. Start by assigning one.
                                            </td>
                                        </tr>
                                    ) : kpis.map((kpi) => (
                                        <tr key={kpi.libId} className="table-row-hover hover:bg-surface-2-light/50 dark:hover:bg-surface-2-dark/50">
                                            <td className="px-5 py-4">
                                                <div className="font-medium text-sm text-text-primary-light dark:text-text-primary-dark">
                                                    {kpi.name}
                                                </div>
                                                <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                                                    {kpi.category}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-text-secondary-light dark:text-text-secondary-dark flex items-center">
                                                    {kpi.weight}%
                                                    {Icons.lock}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 px-2">
                                                <input
                                                    type="number"
                                                    placeholder="Set Target..."
                                                    className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark px-3 py-1.5 rounded-lg text-sm font-medium w-36 shadow-sm overflow-hidden text-text-primary-light dark:text-text-primary-dark focus-ring focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest cursor-pointer hover:text-primary transition-colors">
                                                    ASSIGNED
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Employee Evidence & Final Scoring */}
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                            <h2 className="text-lg font-bold font-heading text-text-primary-light dark:text-text-primary-dark">
                                Employee Evidence & Final Scoring
                            </h2>
                        </div>

                        <div className="flex divide-x divide-border-light dark:divide-border-dark">
                            {/* Left Side: Evidence */}
                            <div className="flex-1 p-5 space-y-4">
                                <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
                                    Submitted Evidence
                                </h3>

                                {/* Evidence Item 1 */}
                                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-white dark:bg-surface-2-dark flex items-center justify-center shadow-sm">
                                            {Icons.documentText}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                                                Q3_Sales_Performance_Report.pdf
                                            </div>
                                            <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                                                2.4 MB • 2 days ago
                                            </div>
                                        </div>
                                    </div>
                                    {Icons.eye}
                                </div>

                                {/* Evidence Item 2 */}
                                <div className="flex items-center justify-between p-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:bg-surface-2-light dark:hover:bg-surface-2-dark transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-white dark:bg-surface-2-dark flex items-center justify-center shadow-sm border border-border-light dark:border-border-dark">
                                            {Icons.image}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                                                Client_Feedback_Survey.png
                                            </div>
                                            <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                                                1.1 MB • 2 days ago
                                            </div>
                                        </div>
                                    </div>
                                    {Icons.eye}
                                </div>
                            </div>

                            {/* Right Side: Scoring */}
                            <div className="flex-1 p-5 flex flex-col">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                                        Manager Final Score
                                    </h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold font-heading text-primary">85</span>
                                        <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">/ 100</span>
                                    </div>
                                </div>

                                {/* Slider bar mock */}
                                <div className="relative h-2 w-full bg-surface-2-light dark:bg-surface-2-dark rounded-full mb-2">
                                    <div className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: "85%" }}></div>
                                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-sm" style={{ left: "85%", transform: "translate(-50%, -50%)" }}></div>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase text-text-muted-light dark:text-text-muted-dark mb-6">
                                    <span>UNSATISFACTORY</span>
                                    <span>MEETS</span>
                                    <span>EXCEEDS</span>
                                </div>

                                {/* Input block */}
                                <textarea
                                    className="w-full flex-1 min-h-[100px] p-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm text-text-primary-light dark:text-text-primary-dark placeholder-text-muted-light dark:placeholder-text-muted-dark focus-ring mb-5 resize-none shadow-sm"
                                    placeholder="Provide scoring comments..."
                                ></textarea>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 mt-auto">
                                    <button className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark hover:bg-surface-2-light dark:hover:bg-surface-2-dark transition-colors shadow-sm focus-ring">
                                        Save Draft
                                    </button>
                                    <button className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary hover:bg-primary-hover text-white transition-colors shadow-sm focus-ring btn-primary-action">
                                        Finalize Score
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-80 flex-shrink-0 space-y-6">
                    {/* Team Members List */}
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden flex flex-col bento-card">
                        <div className="px-5 py-4 border-b border-border-light dark:border-border-dark">
                            <h2 className="text-sm font-bold font-heading text-text-primary-light dark:text-text-primary-dark">
                                Team Members
                            </h2>
                        </div>
                        <div className="p-2 space-y-1">
                            {TEAM_MEMBERS.map((member) => (
                                <div
                                    key={member.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors relative overflow-hidden group
                    ${member.statusType === 'current'
                                            ? "bg-primary/5 border border-primary/20"
                                            : "border border-transparent hover:bg-surface-2-light dark:hover:bg-surface-2-dark"
                                        }
                  `}
                                >
                                    {member.statusType === 'current' && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>
                                    )}

                                    <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover bg-surface-2-light dark:bg-surface-2-dark" />

                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark truncate">
                                            {member.name}
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            {member.score && (
                                                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                                    SCORE: {member.score} •
                                                </span>
                                            )}
                                            <span className={`text-[10px] font-bold tracking-wider uppercase
                        ${member.statusType === 'current' ? 'text-primary' : ''}
                        ${member.statusType === 'completed' ? 'text-text-secondary-light dark:text-text-secondary-dark' : ''}
                        ${member.statusType === 'ready' ? 'text-accent-amber' : ''}
                        ${member.statusType === 'none' ? 'text-text-muted-light dark:text-text-muted-dark' : ''}
                      `}>
                                                {member.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                        {member.statusType === 'completed' && Icons.checkCircle}
                                        {member.statusType === 'ready' && Icons.dotYellow}
                                        {member.statusType === 'none' && Icons.dotGray}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-border-light dark:border-border-dark bg-surface-2-light/50 dark:bg-surface-2-dark/50 flex justify-center mt-1">
                            <button className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark hover:text-primary tracking-widest uppercase transition-colors">
                                VIEW ALL 12 REPORTS
                            </button>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default ManagerPerformance;
