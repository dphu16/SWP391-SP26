import { useState, useEffect, useMemo } from "react";
import { kpiService } from "../../services/kpiService";
import type { PerformanceReview, TeamStats } from "../../services/kpiService";





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

const ManagerPerformance = () => {
    const [kpis, setKpis] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchKpiQuery, setSearchKpiQuery] = useState("");
    const [teamStats, setTeamStats] = useState<TeamStats>({ totalMembers: 0, submittedMembers: 0, averageScore: null });
    const [activeCycleId, setActiveCycleId] = useState<string | null>(null);
    const [cycles, setCycles] = useState<any[]>([]);

    // Review state
    const [activeReview, setActiveReview] = useState<PerformanceReview | null>(null);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [kpiScoreInput, setKpiScoreInput] = useState('');
    const [attitudeScoreInput, setAttitudeScoreInput] = useState('');
    const [managerNoteInput, setManagerNoteInput] = useState('');
    const [scoreSaving, setScoreSaving] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [finalizeFeedback, setFinalizeFeedback] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [hasMentorAssessment, setHasMentorAssessment] = useState(false);

    const activeEmployee = useMemo(() => employees.find(e => e.id === activeEmployeeId), [employees, activeEmployeeId]);

    const filteredKpis = useMemo(() => kpis.filter(k =>
        (k.name || "").toLowerCase().includes(searchKpiQuery.toLowerCase()) ||
        (k.category || "").toLowerCase().includes(searchKpiQuery.toLowerCase())
    ), [kpis, searchKpiQuery]);

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

                // Find active cycle: Priority 1: ACTIVE coverage today, Priority 2: Latest ACTIVE, Priority 3: Latest ANY
                if (cyclesData && cyclesData.length > 0) {
                    const now = new Date();
                    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                    const bestCycle = cyclesData
                        .filter(c => c.status === 'ACTIVE')
                        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                        .find(c => nowStr >= c.startDate && nowStr <= c.endDate)
                        || cyclesData.find(c => c.status === 'ACTIVE')
                        || cyclesData[0];

                    if (bestCycle) setActiveCycleId(bestCycle.cycleId);
                }

                setCycles(cyclesData);

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
            if (!activeEmployeeId || !activeEmployee) return;
            setLoading(true);
            try {
                // Determine department - use active employee's department
                const deptId = activeEmployee.departmentId || activeEmployee.position?.department?.deptId;

                const [allLibs, structure, goals] = await Promise.all([
                    kpiService.getAllKpiLibraries(),
                    deptId ? kpiService.getKpisByDepartment(deptId) : Promise.resolve([]),
                    (activeEmployeeId && activeCycleId)
                        ? kpiService.getGoalsByEmployeeAndCycle(activeEmployeeId, activeCycleId)
                        : kpiService.getGoalsByEmployee(activeEmployeeId)
                ]);

                // Map department structure to UI list, overlaying existing goals
                const merged = (structure.length > 0 ? structure : (goals.length > 0 ? goals.map(g => ({ kpiLibraryId: g.kpiLibrary?.libId || g.kpiLibraryId, weight: g.weight })) : [])).map((s: any) => {
                    const libId = s.kpiLibraryId || s.kpiLibrary?.libId;
                    const lib = allLibs.find(l => l.libId === libId);
                    const goal = goals.find(g => (g.kpiLibrary?.libId || g.kpiLibraryId) === libId);

                    const targetVal = goal?.targetValue || 0;
                    const isActuallyAssigned = !!goal && targetVal > 0;
                    const mt = lib?.measurementType || "NUMERIC";

                    return {
                        goalId: goal?.goalId,
                        cycleId: goal?.cycle?.cycleId,
                        kpiLibraryId: libId,
                        name: goal?.title || lib?.name || "Unknown",
                        category: lib?.category || "N/A",
                        description: lib?.description || "",
                        measurementType: mt,
                        weight: s.weight || lib?.defaultWeight || 0,
                        status: goal?.status || null,
                        imageUrl: goal?.imageUrl || "",
                        _targetValue: isActuallyAssigned ? String(targetVal) : (mt === 'BOOLEAN' ? '1' : ''),
                        _isAssigned: isActuallyAssigned
                    };
                });

                setKpis(merged);
            } catch (error) {
                console.error("loadEmployeeGoals error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadEmployeeGoals();
    }, [activeEmployeeId, activeEmployee?.departmentId]);

    // Fetch active review whenever employee changes
    useEffect(() => {
        if (!activeEmployeeId) return;
        const fetchReview = async () => {
            setReviewLoading(true);
            try {
                const review = await kpiService.getActiveReview(activeEmployeeId);
                setActiveReview(review);

                if (review) {
                    setKpiScoreInput(review.kpiScore !== null ? String(review.kpiScore) : '');
                    setManagerNoteInput(review.rating || '');

                    // Sync active cycle with the review's cycle to ensure consistency
                    if (review.cycle?.cycleId) {
                        setActiveCycleId(review.cycle.cycleId);
                    }

                    // Fetch detailed mentor assessment to get the average score
                    const assessment = await kpiService.getMentorAssessment(review.reviewId);
                    if (assessment) {
                        setAttitudeScoreInput(String(assessment.averageScore || 0));
                        setHasMentorAssessment(true);
                    } else {
                        // Fallback to review level attitudeScore if assessment object not found
                        setAttitudeScoreInput(review.attitudeScore !== null ? String(review.attitudeScore) : '0');
                        setHasMentorAssessment(review.attitudeScore !== null && review.attitudeScore > 0);
                    }
                } else {
                    setKpiScoreInput('');
                    setAttitudeScoreInput('0');
                    setManagerNoteInput('');
                    setHasMentorAssessment(false);
                }
            } catch (error) {
                console.error("Error fetching review data:", error);
            } finally {
                setReviewLoading(false);
            }
        };
        fetchReview();
    }, [activeEmployeeId]);

    const handleAssignTarget = async (kpiLibraryId: string) => {
        const kpiToAssign = kpis.find(k => k.kpiLibraryId === kpiLibraryId);
        if (!kpiToAssign || !activeEmployeeId) return;

        const targetCycleId = kpiToAssign.cycleId || activeCycleId;

        if (!targetCycleId) {
            setActionMessage({ type: 'error', text: 'No active performance cycle found to assign KPIs.' });
            return;
        }

        try {
            await kpiService.assignEmployeeGoal({
                employeeId: activeEmployeeId,
                cycleId: targetCycleId,
                kpiLibraryId: kpiLibraryId,
                targetValue: Number(kpiToAssign._targetValue),
                title: kpiToAssign.name,
                weight: kpiToAssign.weight
            });

            // Refresh goals to get updated status immediately
            if (activeEmployeeId) {
                const [allLibs, structure, goals] = await Promise.all([
                    kpiService.getAllKpiLibraries(),
                    activeEmployee?.departmentId ? kpiService.getKpisByDepartment(activeEmployee.departmentId) : Promise.resolve([]),
                    kpiService.getGoalsByEmployee(activeEmployeeId)
                ]);

                const merged = (structure.length > 0 ? structure : goals.map(g => ({ kpiLibraryId: g.kpiLibrary?.libId || g.kpiLibraryId, weight: g.weight }))).map((s: any) => {
                    const libId = s.kpiLibraryId || s.kpiLibrary?.libId;
                    const lib = allLibs.find(l => l.libId === libId);
                    const goal = goals.find(g => (g.kpiLibrary?.libId || g.kpiLibraryId) === libId);
                    const targetVal = goal?.targetValue || 0;
                    const isActuallyAssigned = !!goal && targetVal > 0;
                    const mt = lib?.measurementType || "NUMERIC";
                    return {
                        goalId: goal?.goalId,
                        cycleId: goal?.cycle?.cycleId,
                        kpiLibraryId: libId,
                        name: goal?.title || lib?.name || "Unknown",
                        category: lib?.category || "N/A",
                        description: lib?.description || "",
                        measurementType: mt,
                        weight: s.weight || lib?.defaultWeight || 0,
                        status: goal?.status || null,
                        imageUrl: goal?.imageUrl || "",
                        _targetValue: isActuallyAssigned ? String(targetVal) : (mt === 'BOOLEAN' ? '1' : ''),
                        _isAssigned: isActuallyAssigned
                    };
                });
                setKpis(merged);
            }
        } catch (e: any) {
            console.error("Failed to assign target", e);
            const errorMsg = e.response?.data?.message || "Failed to save target. Please try again.";
            setActionMessage({ type: 'error', text: errorMsg });
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
        return Math.round(assigned.reduce((s: number, k: any) => s + k.weight, 0) / totalWeight * 100);
    }, [kpis]);

    const allKpisCompleted = useMemo(() => {
        const assignedKpis = kpis.filter(k => k._isAssigned);
        return assignedKpis.length > 0 && assignedKpis.every(k => k.status === 'COMPLETED');
    }, [kpis]);

    const handleSaveDraft = async () => {
        if (!activeReview) return;
        const kpi = parseFloat(kpiScoreInput);
        const att = parseFloat(attitudeScoreInput);
        if (isNaN(kpi) || isNaN(att)) { setActionMessage({ type: 'error', text: 'Please enter valid scores.' }); return; }
        if (kpi < 0 || kpi > 100 || att < 0 || att > 100) { setActionMessage({ type: 'error', text: 'Scores must be between 0 and 100.' }); return; }
        setScoreSaving(true);
        setActionMessage(null);
        try {
            const updated = await kpiService.updateReviewScore(activeReview.reviewId, { kpiScore: kpi, attitudeScore: att, rating: managerNoteInput });
            setActiveReview(updated);
        } catch (e) {
            setActionMessage({ type: 'error', text: 'Failed to save score.' });
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

        // Save scores first if changed, then finalize
        const kpi = parseFloat(kpiScoreInput);
        const att = parseFloat(attitudeScoreInput);

        if (isNaN(kpi) || isNaN(att)) { setActionMessage({ type: 'error', text: 'Please enter KPI Score and Attitude Score first.' }); return; }

        if (!hasMentorAssessment) {
            setFinalizeFeedback({ type: 'error', text: 'Mentor has not submitted their assessment yet.' });
            return;
        }

        setScoreSaving(true);
        setFinalizeFeedback(null);
        try {
            await kpiService.updateReviewScore(activeReview.reviewId, { kpiScore: kpi, attitudeScore: att, rating: managerNoteInput });
            const finalized = await kpiService.finalizeReview(activeReview.reviewId);
            setActiveReview(finalized);

            // Re-fetch team stats after finalization to update Average Score and Progress
            await reloadStats();
            setFinalizeFeedback({ type: 'success', text: 'Review finalized successfully!' });
        } catch (e: any) {
            setFinalizeFeedback({ type: 'error', text: e?.response?.data?.error || 'Failed to finalize review.' });
        } finally {
            setScoreSaving(false);
        }
    };



    return (
        <div className="flex flex-col h-full space-y-5 animate-fade-in font-sans">
            {/* Header section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight">
                        Performance
                    </h1>
                    <p className="mt-0.5 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        Active Period: <span className="text-primary font-bold">{cycles.find(c => c.cycleId === activeCycleId)?.cycleName || "No Active Cycle"}</span>
                    </p>
                </div>

            </div>

            {actionMessage && (
                <div className={`flex items-center gap-2 text-sm font-semibold rounded-lg px-4 py-3 ${actionMessage.type === 'error' ? 'text-red-600 bg-red-50 border border-red-200' : 'text-emerald-600 bg-emerald-50 border border-emerald-200'}`}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                        {actionMessage.type === 'error'
                            ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                            : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        }
                    </svg>
                    {actionMessage.text}
                    <button onClick={() => setActionMessage(null)} className="ml-auto text-xs font-bold opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

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
                                                {kpi.measurementType === 'BOOLEAN' ? (
                                                    <div className="px-4 py-2 bg-surface-2-light/50 dark:bg-surface-2-dark/50 border border-border-light/50 border-dashed rounded-xl text-sm font-bold text-primary flex items-center gap-2">
                                                        {Icons.checkCircle}
                                                        Yes
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={kpi._targetValue}
                                                            readOnly={kpi._isAssigned}
                                                            min="0"
                                                            max={kpi.measurementType === 'PERCENTAGE' ? "100" : undefined}
                                                            onChange={(e) => {
                                                                let val = e.target.value;
                                                                if (kpi.measurementType === 'PERCENTAGE' && val !== '') {
                                                                    if (Number(val) > 100) val = '100';
                                                                    if (Number(val) < 0) val = '0';
                                                                }
                                                                handleTargetChange(kpi.kpiLibraryId, val);
                                                            }}
                                                            className={`w-full px-4 py-2 rounded-xl text-sm font-bold transition-all outline-none ${kpi._isAssigned
                                                                ? 'bg-surface-2-light/50 dark:bg-surface-2-dark/50 text-text-muted-light/60 cursor-not-allowed border-dashed border-border-light/50'
                                                                : 'bg-surface-2-light dark:bg-surface-2-dark border-border-light dark:border-border-dark focus:bg-white dark:focus:bg-surface-dark focus:border-primary focus:ring-4 focus:ring-primary/5'
                                                                } ${kpi.measurementType === 'PERCENTAGE' ? 'pr-8' : ''}`}
                                                        />
                                                        {kpi.measurementType === 'PERCENTAGE' && (
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light font-bold text-[10px] pointer-events-none">%</div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                {!kpi._isAssigned ? (
                                                    <button
                                                        onClick={() => handleAssignTarget(kpi.kpiLibraryId)}
                                                        disabled={!kpi._targetValue || parseFloat(kpi._targetValue) <= 0}
                                                        className="px-4 py-2 bg-primary text-white hover:bg-primary-hover text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all disabled:opacity-30"
                                                    >
                                                        Assign Target
                                                    </button>
                                                ) : kpi.status === 'ASSIGNED' ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">
                                                        Assigned
                                                    </div>
                                                ) : kpi.status === 'ACKNOWLEDGED' ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
                                                        Acknowledged
                                                    </div>
                                                ) : kpi.status === 'SUBMITTED' ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await kpiService.updateEmployeeGoalStatus(kpi.goalId, 'COMPLETED');
                                                                    const updated = await kpiService.getGoalsByEmployeeAndCycle(activeEmployee!.employeeId, activeCycleId!);
                                                                    const allLibs = await kpiService.getAllKpiLibraries();
                                                                    const formatted = updated.map((g: any) => {
                                                                        const lib = allLibs.find(l => l.libId === (g.kpiLibrary?.libId || g.kpiLibraryId));
                                                                        const mt = lib?.measurementType || "NUMERIC";
                                                                        return {
                                                                            goalId: g.goalId,
                                                                            cycleId: g.cycle?.cycleId,
                                                                            kpiLibraryId: g.kpiLibrary?.libId || g.kpiLibraryId,
                                                                            name: g.title || lib?.name || "Unknown",
                                                                            category: lib?.category || g.kpiLibrary?.category || "N/A",
                                                                            description: lib?.description || "",
                                                                            measurementType: mt,
                                                                            weight: g.weight || lib?.defaultWeight || 0,
                                                                            status: g.status,
                                                                            _targetValue: String(g.targetValue || 0),
                                                                            _isAssigned: !!g.targetValue && g.targetValue > 0
                                                                        };
                                                                    });
                                                                    setKpis(formatted);
                                                                } catch (e: any) {
                                                                    setActionMessage({ type: 'error', text: e.response?.data?.message || 'Failed to approve' });
                                                                }
                                                            }}
                                                            className="px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await kpiService.updateEmployeeGoalStatus(kpi.goalId, 'ACKNOWLEDGED', 'Rejected by Manager');
                                                                    const updated = await kpiService.getGoalsByEmployeeAndCycle(activeEmployee!.employeeId, activeCycleId!);
                                                                    const allLibs = await kpiService.getAllKpiLibraries();
                                                                    const formatted = updated.map((g: any) => {
                                                                        const lib = allLibs.find(l => l.libId === (g.kpiLibrary?.libId || g.kpiLibraryId));
                                                                        const mt = lib?.measurementType || "NUMERIC";
                                                                        return {
                                                                            goalId: g.goalId,
                                                                            cycleId: g.cycle?.cycleId,
                                                                            kpiLibraryId: g.kpiLibrary?.libId || g.kpiLibraryId,
                                                                            name: g.title || lib?.name || "Unknown",
                                                                            category: lib?.category || g.kpiLibrary?.category || "N/A",
                                                                            description: lib?.description || "",
                                                                            measurementType: mt,
                                                                            weight: g.weight || lib?.defaultWeight || 0,
                                                                            status: g.status,
                                                                            _targetValue: String(g.targetValue || 0),
                                                                            _isAssigned: !!g.targetValue && g.targetValue > 0
                                                                        };
                                                                    });
                                                                    setKpis(formatted);
                                                                } catch (e: any) {
                                                                    setActionMessage({ type: 'error', text: e.response?.data?.message || 'Failed to reject' });
                                                                }
                                                            }}
                                                            className="px-3 py-1.5 bg-rose-500 text-white hover:bg-rose-600 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : kpi.status === 'COMPLETED' ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                                                        {Icons.checkCircle}
                                                        Completed
                                                    </div>
                                                ) : null}
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
                            <h2 className="text-lg font-bold font-heading text-text-primary-light">Final Scoring & Notes</h2>
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
                                {/* Left: SCORING */}
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
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-[10px] font-black uppercase opacity-60 italic">KPI PERFORMANCE</label>
                                                {computedKpiScore !== null && allKpisCompleted && (
                                                    <button
                                                        onClick={() => setKpiScoreInput(String(computedKpiScore))}
                                                        className="text-[10px] font-black text-primary hover:underline"
                                                    >
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="number"
                                                value={kpiScoreInput}
                                                onChange={e => {
                                                    let val = e.target.value;
                                                    if (val !== '') {
                                                        const num = parseFloat(val);
                                                        if (num > 100) val = '100';
                                                        if (num < 0) val = '0';
                                                    }
                                                    setKpiScoreInput(val);
                                                }}
                                                disabled={activeReview?.status === 'SUBMITTED' || activeReview?.status === 'APPROVED'}
                                                className={`w-full px-4 py-2 text-xl font-black rounded-lg outline-none transition-all placeholder:italic [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${activeReview?.status === 'SUBMITTED' || activeReview?.status === 'APPROVED' ? 'bg-surface-2-light/50 cursor-not-allowed opacity-50' : 'bg-surface-2-light border-none focus:ring-2 focus:ring-primary/20'}`}
                                                placeholder="---"
                                            />
                                        </div>
                                        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-border-light shadow-sm opacity-90">
                                            <label className="block text-[10px] font-black uppercase mb-2 opacity-60 italic">MENTOR ASSESSMENT</label>
                                            <input
                                                type="number"
                                                value={attitudeScoreInput}
                                                readOnly
                                                className="w-full px-4 py-2 text-xl font-black bg-surface-2-light/50 border-none rounded-lg cursor-not-allowed outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 mt-8">
                                        <button
                                            onClick={handleFinalize}
                                            disabled={scoreSaving || activeReview?.status === 'SUBMITTED' || activeReview?.status === 'APPROVED'}
                                            className="w-full py-3.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                                        >
                                            {activeReview?.status === 'SUBMITTED' ? '✓ Data Locked' : 'Finalize Performance Record'}
                                        </button>
                                        {finalizeFeedback && (
                                            <div className={`p-4 border rounded-xl flex items-center gap-3 animate-fade-in ${finalizeFeedback.type === 'error' ? 'bg-rose-50 border-rose-100 animate-shake text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                                <div className={`w-2 h-2 rounded-full animate-pulse ${finalizeFeedback.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                                <p className="text-[10px] font-black uppercase tracking-wider leading-tight">
                                                    {finalizeFeedback.text}
                                                </p>
                                            </div>
                                        )}
                                        <button
                                            onClick={handleSaveDraft}
                                            disabled={scoreSaving || activeReview?.status === 'SUBMITTED' || activeReview?.status === 'APPROVED'}
                                            className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest text-text-primary-light opacity-60 hover:opacity-100 transition-all disabled:opacity-20"
                                        >
                                            {scoreSaving ? 'Processing...' : 'Save Draft Snapshot'}
                                        </button>
                                    </div>
                                </div>

                                {/* Right: Notes */}
                                <div className="flex-[1.2] p-6 flex flex-col min-h-[450px]">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-primary-light mb-4">
                                        Manager's Rating & Notes
                                    </h3>
                                    <textarea
                                        value={managerNoteInput}
                                        onChange={e => setManagerNoteInput(e.target.value)}
                                        disabled={activeReview?.status === 'SUBMITTED' || activeReview?.status === 'APPROVED'}
                                        placeholder="Enter your assessment notes, feedback, and developmental goals here..."
                                        className={`w-full flex-1 p-4 border rounded-xl resize-none outline-none transition-all text-sm font-medium ${activeReview?.status === 'SUBMITTED' || activeReview?.status === 'APPROVED'
                                            ? 'bg-surface-2-light/30 border-dashed border-border-light cursor-not-allowed opacity-50'
                                            : 'bg-surface-2-light dark:bg-surface-2-dark border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary/20 text-text-primary-light dark:text-text-primary-dark'}`}
                                    />
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
