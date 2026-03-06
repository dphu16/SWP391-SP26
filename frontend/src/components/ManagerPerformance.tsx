import { useState, useEffect, useMemo } from "react";
import { kpiService } from "../services/kpiService";
import type { PerformanceReview, TeamStats } from "../services/kpiService";





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
    const [employees, setEmployees] = useState<any[]>([]);
    const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchKpiQuery, setSearchKpiQuery] = useState("");
    const [teamStats, setTeamStats] = useState<TeamStats>({ totalMembers: 0, submittedMembers: 0, averageScore: null });

    // Review state
    const [activeReview, setActiveReview] = useState<PerformanceReview | null>(null);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [kpiScoreInput, setKpiScoreInput] = useState('');
    const [attitudeScoreInput, setAttitudeScoreInput] = useState('');
    const [scoreSaving, setScoreSaving] = useState(false);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const deptsData = await kpiService.getAllDepartments();
                const allKpiLibs = await kpiService.getAllKpiLibraries();
                const employeesData = await kpiService.getMyTeam();
                const cyclesData = await kpiService.getPerformanceCycles();

                console.log("deptsData", deptsData);
                console.log("allKpiLibs", allKpiLibs);
                console.log("employeesData (team)", employeesData);
                console.log("cyclesData", cyclesData);

                let activeDeptKpis: any[] = [];
                if (deptsData && deptsData.length > 0) {
                    activeDeptKpis = await kpiService.getKpisByDepartment(deptsData[0].id);
                }

                console.log("activeDeptKpis", activeDeptKpis);

                // Filter employees under the "mocked manager" (everyone for now)
                setEmployees(employeesData);

                if (employeesData && employeesData.length > 0) {
                    setActiveEmployeeId(employeesData[0].id);
                }

                (window as any).__kpiContext = { deptsData, allKpiLibs, activeDeptKpis, cyclesData };

                // Fetch real team stats from DB
                const stats = await kpiService.getTeamStats();
                setTeamStats(stats);
            } catch (error) {
                console.error("fetchTeamData error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeamData();
    }, []);

    useEffect(() => {
        const loadEmployeeGoals = async () => {
            if (!activeEmployeeId) return;

            const goals = await kpiService.getGoalsByEmployee(activeEmployeeId);
            console.log("goals for employee", activeEmployeeId, goals);

            if (goals && goals.length > 0) {
                // Dedup by kpiLibraryId — keep the goal with the highest targetValue
                const dedupMap = new Map<string, any>();
                for (const g of goals) {
                    const libId = g.kpiLibrary?.libId || g.kpiLibraryId || '';
                    const prev = dedupMap.get(libId);
                    if (!prev || (g.targetValue ?? 0) > (prev.targetValue ?? 0)) {
                        dedupMap.set(libId, g);
                    }
                }
                const dedupedGoals = Array.from(dedupMap.values());

                const formatted = dedupedGoals.map((g: any) => ({
                    goalId: g.goalId,
                    cycleId: g.cycle?.cycleId,
                    kpiLibraryId: g.kpiLibrary?.libId || '',
                    name: g.title || g.kpiLibrary?.name || "Unknown",
                    category: g.kpiLibrary?.category || "",
                    description: g.kpiLibrary?.description || "",
                    weight: g.weight || 0,
                    imageUrl: g.imageUrl || "", // Evidence URL (image_url) from database
                    _targetValue: g.targetValue && g.targetValue !== 0 ? String(g.targetValue) : '',
                    _isAssigned: g.targetValue !== undefined && g.targetValue !== 0
                }));
                setKpis(formatted);
            } else {
                setKpis([]);
            }
        };
        loadEmployeeGoals();
    }, [activeEmployeeId]);

    // Fetch active review whenever employee changes
    useEffect(() => {
        if (!activeEmployeeId) return;
        const fetchReview = async () => {
            setReviewLoading(true);
            const [review, mentorScore] = await Promise.all([
                kpiService.getActiveReview(activeEmployeeId),
                kpiService.getMentorAttitudeScore(activeEmployeeId)
            ]);
            setActiveReview(review);
            if (review) {
                setKpiScoreInput(review.kpiScore !== null && review.kpiScore !== undefined ? String(review.kpiScore) : '');
                // Override with mentor score since it's now managed by Mentor
                setAttitudeScoreInput(String(mentorScore));
            } else {
                setKpiScoreInput('');
                setAttitudeScoreInput(String(mentorScore));
            }
            setReviewLoading(false);
        };
        fetchReview();
    }, [activeEmployeeId]);

    const handleAssignTarget = async (kpiLibraryId: string) => {
        const kpiToAssign = kpis.find(k => k.kpiLibraryId === kpiLibraryId);
        if (!kpiToAssign || !activeEmployeeId) return;

        const activeCycle = kpiToAssign.cycleId || "c2c5ec68-7c85-48ef-be8a-350e82c5f1fa";

        try {
            await kpiService.assignEmployeeGoal({
                employeeId: activeEmployeeId,
                cycleId: activeCycle,
                kpiLibraryId: kpiLibraryId,
                targetValue: Number(kpiToAssign._targetValue),
                title: kpiToAssign.name,
                weight: kpiToAssign.weight
            });

            // Update UI to show assigned
            setKpis(prev => prev.map(k => k.kpiLibraryId === kpiLibraryId ? { ...k, _isAssigned: true } : k));
        } catch (e) {
            console.error("Failed to assign target", e);
            alert("Failed to save target. Please try again.");
        }
    };

    const handleTargetChange = (kpiLibraryId: string, value: string) => {
        setKpis(prev => prev.map(k => k.kpiLibraryId === kpiLibraryId ? { ...k, _targetValue: value, _isAssigned: false } : k));
    };

    // Computed weighted KPI completion score from employee_goals
    const computedKpiScore = useMemo(() => {
        const assigned = kpis.filter(k => k._isAssigned && k._targetValue);
        if (assigned.length === 0) return null;
        const totalWeight = assigned.reduce((s: number, k: any) => s + k.weight, 0);
        if (totalWeight === 0) return null;
        // Weighted achievement: each KPI contributes (weight/totalWeight)*100 when target set
        // We assume achievement = 100% if assigned (no current value without progress logs)
        return Math.round(assigned.reduce((s: number, k: any) => s + k.weight, 0) / totalWeight * 100);
    }, [kpis]);

    const handleSaveDraft = async () => {
        if (!activeReview) return;
        const kpi = parseFloat(kpiScoreInput);
        const att = parseFloat(attitudeScoreInput);
        if (isNaN(kpi) || isNaN(att)) { alert('Please enter valid scores.'); return; }
        if (kpi < 0 || kpi > 100 || att < 0 || att > 100) { alert('Scores must be between 0 and 100.'); return; }
        setScoreSaving(true);
        try {
            const updated = await kpiService.updateReviewScore(activeReview.reviewId, { kpiScore: kpi, attitudeScore: att });
            setActiveReview(updated);
        } catch (e) {
            alert('Failed to save score.');
        } finally {
            setScoreSaving(false);
        }
    };

    const reloadStats = async () => {
        const stats = await kpiService.getTeamStats();
        setTeamStats(stats);
    };

    const handleFinalize = async () => {
        if (!activeReview) return;

        // Check for evidence requirement
        const evidenceCount = kpis.filter(k => k.imageUrl).length;
        if (evidenceCount === 0) {
            alert('Cannot finalize: No evidence images were found for this employee. Please wait for the employee to upload supporting materials.');
            return;
        }

        // Save scores first if changed, then finalize
        const kpi = parseFloat(kpiScoreInput);
        const att = parseFloat(attitudeScoreInput);
        if (isNaN(kpi) || isNaN(att)) { alert('Please enter KPI Score and Attitude Score first.'); return; }
        setScoreSaving(true);
        try {
            await kpiService.updateReviewScore(activeReview.reviewId, { kpiScore: kpi, attitudeScore: att });
            const finalized = await kpiService.finalizeReview(activeReview.reviewId);
            setActiveReview(finalized);

            // Re-fetch team stats after finalization to update Average Score and Progress
            await reloadStats();

            alert('Review finalized successfully!');
        } catch (e: any) {
            alert(e?.response?.data?.error || 'Failed to finalize review.');
        } finally {
            setScoreSaving(false);
        }
    };

    const activeEmployee = employees.find(e => e.id === activeEmployeeId);

    const filteredKpis = kpis.filter(k =>
        (k.name || "").toLowerCase().includes(searchKpiQuery.toLowerCase()) ||
        (k.category || "").toLowerCase().includes(searchKpiQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full space-y-5 animate-fade-in font-sans">
            {/* Header section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight">
                        Performance Module
                    </h1>
                    <p className="mt-0.5 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        Standardized KPI management and scoring workflow
                    </p>
                </div>

                <div className="flex items-center bg-surface-light dark:bg-surface-dark p-1.5 rounded-xl shadow-sm border border-border-light dark:border-border-dark">
                    <button
                        onClick={() => setActiveTab("hr")}
                        className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === "hr"
                            ? "bg-surface-2-light dark:bg-surface-2-dark text-text-primary-light dark:text-text-primary-dark shadow-sm"
                            : "text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light"
                            }`}
                    >
                        HR Config
                    </button>
                    <button
                        onClick={() => setActiveTab("manager")}
                        className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === "manager"
                            ? "bg-primary text-white shadow-sm"
                            : "text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light"
                            }`}
                    >
                        Manager Console
                    </button>
                </div>
            </div>

            <div className="flex gap-6 items-start">
                <div className="flex-1 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-5">
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm bento-card">
                            <h3 className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-3">
                                Team Submission Progress
                            </h3>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-3xl font-bold font-heading text-primary">{teamStats.submittedMembers}</span>
                                <span className="text-xl font-medium text-text-secondary-light dark:text-text-secondary-dark">/ {teamStats.totalMembers}</span>
                            </div>
                            <div className="h-2 w-full bg-surface-2-light dark:bg-surface-2-dark rounded-full overflow-hidden border border-border-light dark:border-border-dark shadow-inner">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                                    style={{ width: teamStats.totalMembers > 0 ? `${(teamStats.submittedMembers / teamStats.totalMembers) * 100}%` : '0%' }}
                                />
                            </div>
                        </div>

                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm bento-card flex flex-col justify-center">
                            <h3 className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-3">
                                Team Average Score
                            </h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold font-heading text-emerald-500">
                                    {teamStats.averageScore !== null ? teamStats.averageScore.toFixed(1) : '—'}
                                </span>
                                <span className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase">
                                    {teamStats.averageScore !== null ? '/ 100 Points' : 'No data yet'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* KPI Table */}
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden flex flex-col bento-card">
                        <div className="px-5 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-white dark:bg-surface-dark/40 backdrop-blur-sm">
                            <h2 className="text-lg font-bold font-heading text-text-primary-light dark:text-text-primary-dark">
                                KPI Setup: <span className="text-primary">{activeEmployee?.fullName || "Select Employee"}</span>
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search KPI..."
                                        value={searchKpiQuery}
                                        onChange={(e) => setSearchKpiQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 w-64 text-sm bg-surface-2-light dark:bg-surface-2-dark border border-border-light dark:border-border-dark rounded-xl text-text-primary-light dark:text-text-primary-dark focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-light dark:border-border-dark bg-surface-2-light/50 dark:bg-surface-2-dark/50">
                                        <th className="px-6 py-4 text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.15em]">Category & Title</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.15em] text-center w-[120px]">Weight</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.15em] w-[200px]">Target Value</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.15em] text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {loading ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center italic text-text-muted-light">Loading KPIs...</td></tr>
                                    ) : filteredKpis.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-text-muted-light">No KPIs match your criteria.</td></tr>
                                    ) : filteredKpis.map((kpi) => (
                                        <tr key={kpi.kpiLibraryId} className="group hover:bg-surface-2-light/30 dark:hover:bg-surface-2-dark/30 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-[15px] text-text-primary-light dark:text-text-primary-dark group-hover:text-primary transition-colors">{kpi.name}</div>
                                                <div className="text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider mt-1">{kpi.category}</div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="inline-flex font-bold text-primary bg-primary/5 px-2 py-1 rounded-lg text-xs border border-primary/20">{kpi.weight}%</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <input
                                                    type="number"
                                                    value={kpi._targetValue}
                                                    readOnly={kpi._isAssigned}
                                                    onChange={kpi._isAssigned ? undefined : (e) => handleTargetChange(kpi.kpiLibraryId, e.target.value)}
                                                    className={`w-full px-4 py-2 rounded-xl text-sm font-bold transition-all outline-none ${kpi._isAssigned
                                                        ? 'bg-surface-2-light/50 dark:bg-surface-2-dark/50 text-text-muted-light/60 cursor-not-allowed border-dashed border-border-light/50'
                                                        : 'bg-surface-2-light dark:bg-surface-2-dark border-border-light dark:border-border-dark focus:bg-white dark:focus:bg-surface-dark focus:border-primary focus:ring-4 focus:ring-primary/5'
                                                        }`}
                                                />
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                {kpi._isAssigned ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                                                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                                                        Finalized
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAssignTarget(kpi.kpiLibraryId)}
                                                        disabled={!kpi._targetValue}
                                                        className="px-4 py-2 bg-primary text-white hover:bg-primary-hover text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all disabled:opacity-30"
                                                    >
                                                        Assign Target
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Evidence & Decision */}
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden flex flex-col bento-card">
                        <div className="px-5 py-4 border-b border-border-light dark:border-border-dark bg-white dark:bg-surface-dark/40 flex items-center justify-between">
                            <h2 className="text-lg font-bold font-heading text-text-primary-light">Evidence Review & Final Scoring</h2>
                            {activeReview && (
                                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase border ${activeReview.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                                    }`}>
                                    {activeReview.status}
                                </span>
                            )}
                        </div>

                        {reviewLoading ? (
                            <div className="p-12 text-center text-text-muted-light">Loading analysis...</div>
                        ) : (
                            <div className="flex divide-x divide-border-light dark:divide-border-dark">
                                {/* Left: Images */}
                                <div className="flex-[1.2] p-6 flex flex-col min-h-[450px]">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-primary-light mb-4 flex items-center justify-between">
                                        Employee Evidence Summary
                                        <span className="text-[10px] opacity-60">{kpis.filter(k => k.imageUrl).length} Files</span>
                                    </h3>

                                    <div className="flex-1 flex flex-col justify-center">
                                        {kpis.filter(k => k.imageUrl).length === 0 ? (
                                            <div className="p-12 border-2 border-dashed border-border-light rounded-2xl flex flex-col items-center opacity-40">
                                                {Icons.image}
                                                <p className="text-xs font-bold mt-2">No Evidence Uploaded</p>
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col gap-4">
                                                <div className="flex-1 relative group rounded-2xl overflow-hidden shadow-2xl bg-black/5 flex items-center justify-center border border-border-light">
                                                    <img
                                                        src={kpis.find(k => k.imageUrl)?.imageUrl}
                                                        className="max-w-full max-h-full object-contain cursor-zoom-in group-hover:scale-105 transition-transform duration-700"
                                                        onClick={() => window.open(kpis.find(k => k.imageUrl)?.imageUrl, '_blank')}
                                                    />
                                                </div>
                                                {kpis.filter(k => k.imageUrl).length > 1 && (
                                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                                        {kpis.filter(k => k.imageUrl).map((kpi, idx) => (
                                                            <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border-2 border-primary/20 flex-shrink-0 cursor-pointer hover:border-primary">
                                                                <img src={kpi.imageUrl} className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>


                                </div>

                                {/* Right: SCORING */}
                                <div className="flex-1 p-6 flex flex-col bg-surface-2-light/20">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-text-primary-light">Final Decision</h3>
                                        <div className="text-right">
                                            <div className="text-3xl font-black text-primary leading-none">
                                                {(parseFloat(kpiScoreInput || '0') * 0.7 + parseFloat(attitudeScoreInput || '0') * 0.3).toFixed(1)}
                                            </div>
                                            <span className="text-[10px] font-bold opacity-50">SCORE / 100</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6 flex-1">
                                        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-border-light shadow-sm">
                                            <label className="block text-[10px] font-black uppercase mb-2 opacity-60 italic">KPI PERFORMANCE (70%)</label>
                                            <input
                                                type="number"
                                                value={kpiScoreInput}
                                                onChange={e => setKpiScoreInput(e.target.value)}
                                                disabled={activeReview?.status === 'SUBMITTED' || activeReview?.status === 'APPROVED'}
                                                className="w-full px-4 py-2 text-xl font-black bg-surface-2-light border-none rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:italic"
                                                placeholder="---"
                                            />
                                        </div>
                                        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-border-light shadow-sm opacity-90">
                                            <label className="block text-[10px] font-black uppercase mb-2 opacity-60 italic">MENTOR ASSESSMENT (30%)</label>
                                            <input
                                                type="number"
                                                value={attitudeScoreInput}
                                                readOnly
                                                className="w-full px-4 py-2 text-xl font-black bg-surface-2-light/50 border-none rounded-lg cursor-not-allowed outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 mt-8">
                                        <button
                                            onClick={handleFinalize}
                                            disabled={scoreSaving || activeReview?.status === 'SUBMITTED' || activeReview?.status === 'APPROVED' || kpis.filter(k => k.imageUrl).length === 0}
                                            className="w-full py-3.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-30"
                                            title={kpis.filter(k => k.imageUrl).length === 0 ? "Evidence required to finalize" : ""}
                                        >
                                            {activeReview?.status === 'SUBMITTED' ? '✓ Data Locked' : 'Finalize Performance Record'}
                                        </button>
                                        <button
                                            onClick={handleSaveDraft}
                                            disabled={scoreSaving || activeReview?.status === 'SUBMITTED' || activeReview?.status === 'APPROVED'}
                                            className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest text-text-primary-light opacity-60 hover:opacity-100 transition-all"
                                        >
                                            {scoreSaving ? 'Processing...' : 'Save Draft Snapshot'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-80 flex-shrink-0 space-y-6">
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light rounded-2xl shadow-xl overflow-hidden flex flex-col bento-card border-t-4 border-t-primary">
                        <div className="px-5 py-4 border-b border-border-light bg-white dark:bg-surface-dark/40">
                            <h2 className="text-xs font-black uppercase tracking-widest text-text-primary-light">Team Roster</h2>
                        </div>
                        <div className="p-2 space-y-1.5 max-h-[600px] overflow-y-auto scrollbar-none">
                            {employees.map((member) => (
                                <div
                                    key={member.id}
                                    onClick={() => setActiveEmployeeId(member.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${member.id === activeEmployeeId ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'hover:bg-surface-2-light'
                                        }`}
                                >
                                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName || "User")}&background=random`} className="w-10 h-10 rounded-full border-2 border-white/20 shadow-sm" />
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-bold truncate ${member.id === activeEmployeeId ? 'text-white' : 'text-text-primary-light'}`}>{member.fullName}</div>
                                        <div className={`text-[10px] uppercase font-black opacity-60 ${member.id === activeEmployeeId ? 'text-white' : 'text-text-muted-light'}`}>
                                            {member.id === activeEmployeeId ? 'Selected Member' : 'Team Member'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerPerformance;
