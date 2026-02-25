import { useState, useEffect, useMemo } from "react";
import { kpiService } from "../services/kpiService";
import type { PerformanceReview } from "../services/kpiService";





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
                const employeesData = await kpiService.getAllEmployees();
                const cyclesData = await kpiService.getPerformanceCycles();

                console.log("deptsData", deptsData);
                console.log("allKpiLibs", allKpiLibs);
                console.log("employeesData", employeesData);
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

                // Save global lookup context for subsequent loads
                (window as any).__kpiContext = { deptsData, allKpiLibs, activeDeptKpis, cyclesData };
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
            const ctx = (window as any).__kpiContext;
            if (!ctx) return;

            // Fetch goals saved for this employee
            const goals = await kpiService.getGoalsByEmployee(activeEmployeeId);
            console.log("goals for employee", activeEmployeeId, goals);

            // Merge with assigned department structure
            if (ctx.activeDeptKpis && ctx.activeDeptKpis.length > 0) {
                const formatted = ctx.activeDeptKpis.map((detail: any) => {
                    const def = ctx.allKpiLibs.find((k: any) => k.libId === detail.kpiLibraryId);
                    const existingGoal = goals.find((g: any) => g.kpiLibrary.libId === detail.kpiLibraryId);

                    return {
                        ...detail,
                        name: def?.name || "Unknown",
                        category: def?.category || "",
                        description: def?.description || "",
                        _targetValue: existingGoal ? existingGoal.targetValue : '',
                        _isAssigned: !!existingGoal
                    }
                });
                setKpis(formatted);
            } else {
                setKpis([]); // Blank if none assigned
            }
        }
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

        const ctx = (window as any).__kpiContext;
        const activeCycle = ctx?.cyclesData?.[0]?.cycleId || "c2c5ec68-7c85-48ef-be8a-350e82c5f1fa";

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

    const handleFinalize = async () => {
        if (!activeReview) return;
        // Save scores first if changed, then finalize
        const kpi = parseFloat(kpiScoreInput);
        const att = parseFloat(attitudeScoreInput);
        if (isNaN(kpi) || isNaN(att)) { alert('Please enter KPI Score and Attitude Score first.'); return; }
        setScoreSaving(true);
        try {
            await kpiService.updateReviewScore(activeReview.reviewId, { kpiScore: kpi, attitudeScore: att });
            const finalized = await kpiService.finalizeReview(activeReview.reviewId);
            setActiveReview(finalized);
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
        <div className="flex flex-col h-full space-y-5 animate-fade-in">
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
                            ? "bg-primary text-white shadow-sm"
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
                                Team KPI Overview: <span className="text-primary">{activeEmployee?.fullName || "Select Employee"}</span>
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
                                        className="pl-9 pr-4 py-1.5 w-64 text-sm bg-surface-2-light dark:bg-surface-2-dark border border-border-light dark:border-border-dark rounded-lg text-text-primary-light dark:text-text-primary-dark placeholder-text-muted-light dark:placeholder-text-muted-dark focus-ring"
                                    />
                                </div>
                                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md tracking-wider">
                                    Q1 2024 PERIOD
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-light dark:border-border-dark bg-surface-2-light dark:bg-surface-2-dark">
                                        <th className="px-5 py-3 text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest w-[35%]">
                                            Category
                                        </th>
                                        <th className="px-5 py-3 text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest text-center">
                                            Weighting (HR)
                                        </th>
                                        <th className="px-5 py-3 text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest w-[25%]">
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
                                            <td colSpan={4} className="px-5 py-6 text-center text-text-muted-light dark:text-text-muted-dark">
                                                Loading KPIs...
                                            </td>
                                        </tr>
                                    ) : filteredKpis.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-6 text-center text-text-muted-light dark:text-text-muted-dark">
                                                {kpis.length === 0 ? "No KPIs found. The HR must define the KPI structure for this department first." : "No KPIs match your search."}
                                            </td>
                                        </tr>
                                    ) : filteredKpis.map((kpi) => (
                                        <tr key={kpi.kpiLibraryId} className="table-row-hover hover:bg-surface-2-light/50 dark:hover:bg-surface-2-dark/50 p-2">
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-[15px] text-text-primary-light dark:text-text-primary-dark">
                                                    {kpi.name}
                                                </div>
                                                <div className="text-[13px] text-text-secondary-light dark:text-text-secondary-dark font-medium mt-1">
                                                    {kpi.category}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="inline-flex font-semibold text-text-secondary-light dark:text-text-secondary-dark items-center bg-surface-2-light dark:bg-surface-2-dark px-2.5 py-1 rounded-md text-sm border border-border-light dark:border-border-dark">
                                                    {kpi.weight}%
                                                    {Icons.lock}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        placeholder="e.g 1000..."
                                                        value={kpi._targetValue}
                                                        onChange={(e) => handleTargetChange(kpi.kpiLibraryId, e.target.value)}
                                                        className={`w-full bg-surface-light dark:bg-surface-dark border px-3 py-2 rounded-lg text-sm font-semibold shadow-sm overflow-hidden text-text-primary-light dark:text-text-primary-dark focus-ring focus:outline-none transition-colors
                                                            ${kpi._isAssigned ? 'border-primary bg-primary/5' : 'border-border-light dark:border-border-dark'}
                                                        `}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {kpi._isAssigned ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold uppercase tracking-widest border border-green-500/20">
                                                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                                                        Assigned
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAssignTarget(kpi.kpiLibraryId)}
                                                        disabled={!kpi._targetValue}
                                                        className="px-4 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 text-xs font-bold rounded-lg uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary/10 disabled:hover:text-primary">
                                                        Save Target
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Employee Evidence & Final Scoring */}
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between">
                            <h2 className="text-lg font-bold font-heading text-text-primary-light dark:text-text-primary-dark">
                                Employee Evidence &amp; Final Scoring
                            </h2>
                            {activeReview && (
                                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${activeReview.status === 'SUBMITTED' || activeReview.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                    {activeReview.status}
                                </span>
                            )}
                        </div>

                        {reviewLoading ? (
                            <div className="p-8 text-center text-text-muted-light dark:text-text-muted-dark text-sm">Loading review data...</div>
                        ) : (
                            <div className="flex divide-x divide-border-light dark:divide-border-dark">
                                {/* Left Side: Evidence — assigned KPI goals */}
                                <div className="flex-1 p-5 space-y-3">
                                    <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                                        Assigned KPI Targets (Evidence)
                                    </h3>

                                    {kpis.filter(k => k._isAssigned).length === 0 ? (
                                        <div className="text-center py-6 text-text-muted-light dark:text-text-muted-dark">
                                            <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            <p className="text-xs">No KPI targets assigned yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {kpis.filter(k => k._isAssigned).map(kpi => (
                                                <div key={kpi.kpiLibraryId} className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-white dark:bg-surface-2-dark flex items-center justify-center shadow-sm border border-primary/20 text-primary font-bold text-xs">
                                                            {kpi.weight}%
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">{kpi.name}</div>
                                                            <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Target: <span className="font-semibold text-primary">{kpi._targetValue}</span></div>
                                                        </div>
                                                    </div>
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                                                        SET
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* KPI Completion summary */}
                                    {computedKpiScore !== null && (
                                        <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                                            <p className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-1">KPI Assignment Coverage</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-bold font-heading text-primary">{computedKpiScore}%</span>
                                                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">of total weight assigned</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-surface-2-light dark:bg-surface-2-dark rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${computedKpiScore}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Manager Scoring */}
                                <div className="flex-1 p-5 flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">Manager Final Score</h3>
                                        {activeReview?.overallScore !== null && activeReview?.overallScore !== undefined && (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-bold font-heading text-primary">{activeReview.overallScore.toFixed(1)}</span>
                                                <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">/ 100</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Overall score bar */}
                                    {activeReview?.overallScore !== null && activeReview?.overallScore !== undefined && (
                                        <div className="mb-4">
                                            <div className="relative h-2 w-full bg-surface-2-light dark:bg-surface-2-dark rounded-full mb-1">
                                                <div className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.min(activeReview.overallScore, 100)}%` }} />
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase text-text-muted-light dark:text-text-muted-dark">
                                                <span>UNSATISFACTORY</span><span>MEETS</span><span>EXCEEDS</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Score inputs */}
                                    <div className="space-y-3 mb-4">
                                        <div>
                                            <label className="block text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-1">
                                                KPI Score <span className="text-text-secondary-light normal-case font-normal">(0–100, weight 70%)</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0" max="100"
                                                value={kpiScoreInput}
                                                onChange={e => setKpiScoreInput(e.target.value)}
                                                disabled={activeReview?.status === 'SUBMITTED' || activeReview?.status === 'APPROVED'}
                                                placeholder="e.g. 85"
                                                className="w-full px-3 py-2 text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-1">
                                                Mentor's Attitude Rating <span className="text-text-secondary-light normal-case font-normal">(0–100, weight 30%)</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={attitudeScoreInput}
                                                    readOnly
                                                    className="w-full pl-9 pr-3 py-2 text-sm bg-surface-2-light dark:bg-surface-2-dark border border-border-light dark:border-border-dark rounded-lg text-text-muted-light dark:text-text-muted-dark cursor-not-allowed opacity-80 shadow-inner"
                                                />
                                                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <p className="mt-1 text-[11px] text-primary font-medium flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                Auto-fetched from Mentor's evaluation
                                            </p>
                                        </div>
                                        {kpiScoreInput && attitudeScoreInput && (
                                            <div className="px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
                                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Preview Overall Score</p>
                                                <p className="text-lg font-bold text-primary">
                                                    {(parseFloat(kpiScoreInput || '0') * 0.7 + parseFloat(attitudeScoreInput || '0') * 0.3).toFixed(1)} / 100
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-3 mt-auto">
                                        <button
                                            onClick={handleSaveDraft}
                                            disabled={scoreSaving || activeReview?.status === 'SUBMITTED' || activeReview?.status === 'APPROVED'}
                                            className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark hover:bg-surface-2-light dark:hover:bg-surface-2-dark transition-colors shadow-sm focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {scoreSaving ? 'Saving...' : 'Save Draft'}
                                        </button>
                                        <button
                                            onClick={handleFinalize}
                                            disabled={scoreSaving || activeReview?.status === 'SUBMITTED' || activeReview?.status === 'APPROVED'}
                                            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary hover:bg-primary-hover text-white transition-colors shadow-sm focus-ring btn-primary-action disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {activeReview?.status === 'SUBMITTED' ? '✓ Finalized' : 'Finalize Score'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-80 flex-shrink-0 space-y-6">
                    {/* Team Members List */}
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden flex flex-col bento-card">
                        <div className="px-5 py-4 border-b border-border-light dark:border-border-dark">
                            <h2 className="text-sm font-bold font-heading text-text-primary-light dark:text-text-primary-dark">
                                Department Members
                            </h2>
                        </div>
                        <div className="p-2 space-y-1">
                            {employees.map((member) => (
                                <div
                                    key={member.id}
                                    onClick={() => setActiveEmployeeId(member.id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors relative overflow-hidden group
                    ${member.id === activeEmployeeId
                                            ? "bg-primary/5 border border-primary/20"
                                            : "border border-transparent hover:bg-surface-2-light dark:hover:bg-surface-2-dark"
                                        }
                  `}
                                >
                                    {member.id === activeEmployeeId && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>
                                    )}

                                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName || "User")}&background=random`} alt={member.fullName || "User"} className="w-10 h-10 rounded-full object-cover bg-surface-2-light dark:bg-surface-2-dark" />

                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark truncate">
                                            {member.fullName || "User"}
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className={`text-[10px] font-bold tracking-wider uppercase
                        ${member.id === activeEmployeeId ? 'text-primary' : 'text-text-muted-light dark:text-text-muted-dark'}
                      `}>
                                                {member.id === activeEmployeeId ? 'CURRENT SELECTION' : 'AVAILABLE'}
                                            </span>
                                        </div>
                                    </div>
                                    {member.id === activeEmployeeId && (
                                        <div className="flex-shrink-0">
                                            {Icons.dotYellow}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {employees.length === 0 && !loading && (
                                <div className="text-sm text-center text-text-muted-light py-5">
                                    No employees found.
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-border-light dark:border-border-dark bg-surface-2-light/50 dark:bg-surface-2-dark/50 flex justify-center mt-1">
                            <button className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark hover:text-primary tracking-widest uppercase transition-colors">
                                VIEW ALL {employees.length} REPORTS
                            </button>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default ManagerPerformance;
