import { kpiService } from "../services/kpiService";
import type { KpiLibrary, Department, KpiDetailDto, PerformanceCycle, CreateCycleRequest } from "../services/kpiService";



const Icons = {
    checkCircle: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
    ),
    dotGreen: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary">
            <circle cx="10" cy="10" r="4" fill="currentColor" />
            <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    ),
    dotYellow: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-accent-amber">
            <circle cx="10" cy="10" r="4" fill="currentColor" />
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.4" />
        </svg>
    ),
    dotGray: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark opacity-50">
            <circle cx="10" cy="10" r="4" />
        </svg>
    ),
    cog: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors cursor-pointer">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
    ),
    search: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark cursor-pointer hover:text-primary transition-colors">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
    ),
    plus: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-1 inline-block">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
    ),
    building: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline-block mr-1">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
        </svg>
    ),
    wrench: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary mr-2 inline-block">
            <path fillRule="evenodd" d="M11 2a1 1 0 10-2 0v5.5a.5.5 0 01-1 0V2a1 1 0 10-2 0v5.5a2.5 2.5 0 002.046 2.457c-.15.3-.263.626-.33.967l-3.518 3.518a2.25 2.25 0 003.182 3.182l3.518-3.518c.34-.067.667-.18.967-.33A2.5 2.5 0 0014 9.5V2a1 1 0 10-2 0v5.5a.5.5 0 01-1 0V2z" clipRule="evenodd" />
        </svg>
    ),
    arrowRight: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary ml-1 inline-block">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
        </svg>
    )
};

import { useState, useEffect, useMemo } from "react";
import type { GlobalStats } from "../services/kpiService";

const HRPerformance = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
    const [allKpis, setAllKpis] = useState<KpiLibrary[]>([]);
    const [structureDetails, setStructureDetails] = useState<KpiDetailDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddKpiModalOpen, setIsAddKpiModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'library' | 'new'>('library');
    const [viewMode, setViewMode] = useState<"global" | "specific" | "cycles">("global");
    const [globalStats, setGlobalStats] = useState<GlobalStats>({
        orgAverageScore: 0,
        totalKpiTargetValue: 0
    });

    // Cycles state
    const [cycles, setCycles] = useState<PerformanceCycle[]>([]);
    const [cyclesLoading, setCyclesLoading] = useState(false);
    const [showCycleModal, setShowCycleModal] = useState(false);
    const [editingCycle, setEditingCycle] = useState<PerformanceCycle | null>(null);
    const [cycleForm, setCycleForm] = useState<CreateCycleRequest>({
        cycleName: '',
        startDate: '',
        endDate: ''
    });
    const [cycleSaving, setCycleSaving] = useState(false);
    const [cycleError, setCycleError] = useState('');

    // New KPI Form State
    const KPI_CATEGORIES = ['EVALUATION', 'BEHAVIORAL', 'FINANCIAL', 'OPERATIONAL'] as const;
    const [newKpi, setNewKpi] = useState({
        name: '',
        category: 'EVALUATION' as string,
        defaultWeight: 10,
        description: ''
    });

    // Search & Pagination
    const [kpiSearch, setKpiSearch] = useState('');
    const [kpiPage, setKpiPage] = useState(1);
    const KPI_PAGE_SIZE = 5;

    useEffect(() => {
        const fetchInitialData = async () => {
            const [deptsData, kpisData] = await Promise.all([
                kpiService.getAllDepartments(),
                kpiService.getAllKpiLibraries()
            ]);

            if (kpisData) setAllKpis(kpisData);

            if (deptsData && deptsData.length > 0) {
                setDepartments(deptsData);
                setSelectedDeptId(deptsData[0].id);
            }
            setLoading(false);
        };
        fetchInitialData();
    }, []);

    // Fetch global stats or cycles when viewMode changes
    useEffect(() => {
        if (viewMode === 'global') {
            const fetchGlobalStats = async () => {
                const data = await kpiService.getGlobalStats();
                setGlobalStats(data);
            };
            fetchGlobalStats();
        } else if (viewMode === 'cycles') {
            const fetchCycles = async () => {
                setCyclesLoading(true);
                const data = await kpiService.getPerformanceCycles();
                setCycles(data);
                setCyclesLoading(false);
            };
            fetchCycles();
        }
    }, [viewMode]);

    useEffect(() => {
        if (selectedDeptId) {
            const fetchStructure = async () => {
                const details = await kpiService.getKpisByDepartment(selectedDeptId);
                if (details && details.length > 0) {
                    setStructureDetails(details);
                } else {
                    setStructureDetails([]);
                }
            };
            fetchStructure();
        }
    }, [selectedDeptId]);

    const handleWeightChange = (libraryId: string, newWeight: number) => {
        setStructureDetails(prev => prev.map(d =>
            d.kpiLibraryId === libraryId ? { ...d, weight: newWeight } : d
        ));
    };

    const handleSave = async () => {
        if (!selectedDeptId) return;
        if (currentTotalWeight > 100) {
            alert(`Cannot publish! Total weight is ${currentTotalWeight}% — it must equal exactly 100%. Please adjust the weights before publishing.`);
            return;
        }
        if (currentTotalWeight < 100) {
            const confirm = window.confirm(`Total weight is only ${currentTotalWeight}%. It is recommended to reach exactly 100% for optimal evaluation. Publish anyway?`);
            if (!confirm) return;
        }
        try {
            await kpiService.assignKpisToDepartment({
                departmentId: selectedDeptId,
                details: structureDetails
            });
            alert("Published KPI Structure to all employees successfully!");
        } catch (e) {
            alert("Error publishing KPI Structure");
        }
    };

    // Save Draft: only saves the structure template, does NOT publish to employee goals.
    const handleSaveDraft = async () => {
        if (!selectedDeptId) return;
        try {
            await kpiService.saveDraftKpiStructure({
                departmentId: selectedDeptId,
                details: structureDetails
            });
            alert("Draft saved! KPI structure saved for this department (not yet published to employees).");
        } catch (e) {
            alert("Error saving draft");
        }
    };

    // Cycle Handlers
    const openNewCycleModal = () => {
        setEditingCycle(null);
        setCycleForm({ cycleName: '', startDate: '', endDate: '' });
        setCycleError('');
        setShowCycleModal(true);
    };

    const openEditCycleModal = (cycle: PerformanceCycle) => {
        setEditingCycle(cycle);
        setCycleForm({
            cycleName: cycle.cycleName,
            startDate: cycle.startDate,
            endDate: cycle.endDate
        });
        setCycleError('');
        setShowCycleModal(true);
    };

    const handleSaveCycle = async () => {
        if (!cycleForm.cycleName || !cycleForm.startDate || !cycleForm.endDate) {
            setCycleError('Please fill in all required fields.');
            return;
        }
        setCycleSaving(true);
        setCycleError('');
        try {
            if (editingCycle) {
                const updated = await kpiService.updatePerformanceCycle(editingCycle.cycleId, cycleForm);
                setCycles(prev => prev.map(c => c.cycleId === updated.cycleId ? updated : c));
            } else {
                const created = await kpiService.createPerformanceCycle(cycleForm);
                setCycles(prev => [created, ...prev]);
            }
            setShowCycleModal(false);
        } catch (e: any) {
            setCycleError(e?.response?.data?.error || 'Failed to save cycle.');
        } finally {
            setCycleSaving(false);
        }
    };

    const handleCycleStatusChange = async (cycle: PerformanceCycle, newStatus: string) => {
        try {
            const updated = await kpiService.updateCycleStatus(cycle.cycleId, newStatus);
            setCycles(prev => prev.map(c => c.cycleId === updated.cycleId ? updated : c));
        } catch (e: any) {
            alert(e?.response?.data?.error || 'Cannot update status.');
        }
    };

    const activeDepartment = useMemo(() => {
        return departments.find(d => d.id === selectedDeptId);
    }, [departments, selectedDeptId]);

    // Calculate Global Weight Total dynamically for current department
    const currentTotalWeight = useMemo(() => {
        return structureDetails.reduce((sum, item) => sum + (item.weight || 0), 0);
    }, [structureDetails]);

    // Construct the displayed KPIs mapping from allKpis and structureDetails
    const displayKpis = useMemo(() => {
        if (!structureDetails || structureDetails.length === 0) return [];
        return structureDetails.map(detail => {
            const kpiDef = allKpis.find(k => k.libId === detail.kpiLibraryId);
            return {
                ...detail,
                name: kpiDef?.name || "Unknown KPI",
                category: kpiDef?.category || "",
                description: kpiDef?.description || ""
            };
        });
    }, [structureDetails, allKpis]);

    const availableKpis = useMemo(() => {
        return allKpis.filter(k => !structureDetails.some(d => d.kpiLibraryId === k.libId));
    }, [allKpis, structureDetails]);

    // Filtered displayKpis based on search
    const filteredDisplayKpis = useMemo(() => {
        if (!kpiSearch.trim()) return displayKpis;
        const q = kpiSearch.toLowerCase();
        return displayKpis.filter(k =>
            (k.name || '').toLowerCase().includes(q) ||
            (k.category || '').toLowerCase().includes(q) ||
            (k.description || '').toLowerCase().includes(q)
        );
    }, [displayKpis, kpiSearch]);

    // Paginated
    const totalKpiPages = Math.ceil(filteredDisplayKpis.length / KPI_PAGE_SIZE);
    const paginatedKpis = useMemo(() => {
        const start = (kpiPage - 1) * KPI_PAGE_SIZE;
        return filteredDisplayKpis.slice(start, start + KPI_PAGE_SIZE);
    }, [filteredDisplayKpis, kpiPage, KPI_PAGE_SIZE]);

    const handleAddKpi = (kpi: KpiLibrary) => {
        if (structureDetails.some(d => d.kpiLibraryId === kpi.libId)) return; // already added
        setStructureDetails(prev => [...prev, { kpiLibraryId: kpi.libId, weight: kpi.defaultWeight }]);
    };

    const handleCreateAndAddKpi = async () => {
        // Check for duplicate name
        const trimmedName = newKpi.name.trim();
        const isDuplicateName = allKpis.some(k => k.name.trim().toLowerCase() === trimmedName.toLowerCase());
        if (isDuplicateName) {
            alert(`A KPI named "${trimmedName}" already exists in the library. Please use a different name.`);
            return;
        }
        try {
            const created = await kpiService.createKpiLibrary({ ...newKpi, name: trimmedName });
            setAllKpis(prev => [...prev, created]);
            handleAddKpi(created);
            setIsAddKpiModalOpen(false);
            setNewKpi({ name: '', category: 'EVALUATION', defaultWeight: 10, description: '' });
            alert("New KPI created and added!");
        } catch (e) {
            alert("Failed to create new KPI");
        }
    };

    return (
        <div className="flex flex-col h-full space-y-5 animate-fade-in">
            {/* Header section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight">
                        Performance Module
                    </h1>
                    <p className="mt-0.5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        Global KPI Structure Definition & Cross-department Review
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    {/* View Switcher */}
                    <div className="flex bg-surface-2-light dark:bg-surface-2-dark p-1 rounded-xl shadow-inner border border-border-light dark:border-border-dark">
                        <button
                            onClick={() => setViewMode("global")}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === "global"
                                ? "bg-white dark:bg-surface-dark text-primary shadow-sm"
                                : "text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light"
                                }`}
                        >
                            Global
                        </button>
                        <button
                            onClick={() => setViewMode("specific")}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === "specific"
                                ? "bg-white dark:bg-surface-dark text-primary shadow-sm"
                                : "text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light"
                                }`}
                        >
                            Specific
                        </button>
                        <button
                            onClick={() => setViewMode("cycles")}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === "cycles"
                                ? "bg-white dark:bg-surface-dark text-primary shadow-sm"
                                : "text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light"
                                }`}
                        >
                            Cycles
                        </button>
                    </div>

                    <div className="flex items-center bg-surface-light dark:bg-surface-dark p-1 rounded-xl shadow-sm border border-border-light dark:border-border-dark">
                        <button
                            onClick={() => setActiveTab("hr")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "hr"
                                ? "bg-primary text-white shadow-sm"
                                : "text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light"
                                }`}
                        >
                            HR Config
                        </button>
                        <button
                            onClick={() => setActiveTab("manager")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "manager"
                                ? "bg-surface-light dark:bg-surface-dark text-text-primary-light shadow-sm"
                                : "text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-2-light dark:hover:bg-surface-2-dark"
                                }`}
                        >
                            Manager Console
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === "global" && (
                <div className="flex flex-col gap-6 animate-fade-in">
                    {/* Global KPI Metrics */}
                    <div className="grid grid-cols-2 gap-5">
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5 shadow-sm bento-card">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
                                Org Average Score
                            </h3>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold font-heading text-primary">{globalStats.orgAverageScore.toFixed(1)}</span>
                                <span className="text-sm font-bold text-green-500 mb-1">+2.4%</span>
                            </div>
                        </div>
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm bento-card">
                            <h3 className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-2">
                                Total KPIs Assigned
                            </h3>
                            <span className="text-3xl font-bold font-heading">{globalStats.totalKpiTargetValue.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Department Leaderboard */}
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm p-5 bento-card">
                            <h2 className="text-sm font-bold font-heading text-text-primary-light dark:text-text-primary-dark mb-6">
                                Department Leaderboard
                            </h2>
                            <div className="space-y-5">
                                {[
                                    { name: "IT Engineering", score: 92, color: "bg-blue-500" },
                                    { name: "Sales & Marketing", score: 88, color: "bg-primary" },
                                    { name: "Finance", score: 84, color: "bg-accent-amber" },
                                    { name: "Human Resources", score: 79, color: "bg-gray-400" }
                                ].map((dept, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm font-bold mb-1.5">
                                            <span>{dept.name}</span>
                                            <span>{dept.score} pts</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-surface-2-light dark:bg-surface-2-dark rounded-full overflow-hidden">
                                            <div className={`h-full ${dept.color} rounded-full transition-all duration-1000`} style={{ width: `${dept.score}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bell Curve Mock (Score Distribution) */}
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm p-5 bento-card flex flex-col">
                            <h2 className="text-sm font-bold font-heading text-text-primary-light dark:text-text-primary-dark mb-6">
                                Company Score Distribution (Bell Curve)
                            </h2>
                            <div className="flex-1 flex items-end justify-between gap-2 px-4 h-48 relative">
                                {/* SVG Bell Curve overlay line mock */}
                                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                                    <path d="M 0 100 Q 25 100 40 50 T 50 10 Q 60 50 75 100" fill="none" stroke="rgba(124, 58, 237, 0.4)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                                </svg>

                                {/* Bars representing bins */}
                                {[10, 20, 45, 80, 100, 85, 40, 15, 5].map((height, i) => (
                                    <div key={i} className="w-full bg-primary/20 rounded-t-sm hover:bg-primary/40 transition-colors group relative" style={{ height: `${height}%` }}>
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gray-800 text-white px-2 py-1 rounded shadow-lg pointer-events-none transition-opacity">
                                            {Math.floor(height * 2.5)} staff
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between text-xs font-bold text-text-muted-light mt-4 uppercase tracking-widest pt-3 border-t border-border-light relative z-10">
                                <span>&lt; 50 (Poor)</span>
                                <span>75 (Average)</span>
                                <span>&gt; 95 (Exceeds)</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === "specific" && (
                <div className="flex gap-6 items-start animate-fade-in-up">
                    {/* Left Column (Main Content) */}
                    <div className="flex-1 space-y-6">
                        {/* Top Stats Row */}
                        <div className="grid grid-cols-3 gap-5">
                            {/* Standardization Rate */}
                            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm bento-card">
                                <h3 className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-3">
                                    Library Utilization
                                </h3>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-3xl font-bold font-heading">
                                        {allKpis.length > 0 ? Math.round((structureDetails.length / allKpis.length) * 100) : 0}%
                                    </span>
                                    <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                                        of global KPIs used here
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-surface-2-light dark:bg-surface-2-dark rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${allKpis.length > 0 ? (structureDetails.length / allKpis.length) * 100 : 0}%` }}></div>
                                </div>
                            </div>

                            {/* Departments Pendng Review */}
                            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm bento-card">
                                <h3 className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-3">
                                    Total Departments
                                </h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold font-heading">{departments.length}</span>
                                    <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark ml-1">Listed in system</span>
                                </div>
                            </div>

                            {/* Global Weight Total */}
                            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm bento-card flex flex-col">
                                <h3 className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-3 whitespace-nowrap overflow-hidden text-ellipsis">
                                    Total Weight Configured
                                </h3>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className={`text-3xl font-bold font-heading ${currentTotalWeight === 100 ? 'text-primary' : currentTotalWeight > 100 ? 'text-red-500' : 'text-accent-amber'}`}>
                                        {currentTotalWeight}%
                                    </span>
                                    <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark ml-1">
                                        {currentTotalWeight === 100 ? "Perfectly balanced" : currentTotalWeight > 100 ? "Over 100%!" : "Needs more KPIs"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* KPI Structure Definition Header */}
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden flex flex-col">
                            <div className="px-5 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-surface-light dark:bg-surface-dark gap-3">
                                <div>
                                    <h2 className="text-lg font-bold font-heading text-text-primary-light dark:text-text-primary-dark">
                                        KPI Structure Definition:
                                    </h2>
                                    <h2 className="text-lg font-bold font-heading text-primary">
                                        {activeDepartment ? activeDepartment.name : "N/A"}
                                    </h2>
                                </div>

                                {/* Search KPI */}
                                <div className="flex-1 max-w-xs relative">
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-light dark:text-text-muted-dark pointer-events-none">
                                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search KPI name, category..."
                                        value={kpiSearch}
                                        onChange={(e) => { setKpiSearch(e.target.value); setKpiPage(1); }}
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-surface-2-light dark:bg-surface-2-dark border border-border-light dark:border-border-dark rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Add Button */}
                                    <button
                                        onClick={() => setIsAddKpiModalOpen(true)}
                                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg shadow-sm transition-colors focus-ring flex items-center gap-2 btn-primary-action"
                                    >
                                        {Icons.plus} Add New Category / KPI
                                    </button>
                                </div>
                            </div>

                            {/* KPI Definitions Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border-light dark:border-border-dark">
                                            <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest w-[35%]">
                                                KPI Item & Category
                                            </th>
                                            <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest w-[20%] text-center">
                                                Mandatory Weight (%)
                                            </th>
                                            <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest w-[35%]">
                                                Measurement Logic
                                            </th>
                                            <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest text-right">
                                                Settings
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
                                        ) : paginatedKpis.length === 0 && kpiSearch ? (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-6 text-center text-text-muted-light dark:text-text-muted-dark">
                                                    No KPIs match &quot;{kpiSearch}&quot;.
                                                </td>
                                            </tr>
                                        ) : filteredDisplayKpis.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-6 text-center text-text-muted-light dark:text-text-muted-dark">
                                                    No KPIs assigned to this department yet.
                                                </td>
                                            </tr>
                                        ) : paginatedKpis.map((kpi) => (
                                            <tr key={kpi.kpiLibraryId} className="table-row-hover hover:bg-surface-2-light/50 dark:hover:bg-surface-2-dark/50 p-2">
                                                <td className="px-5 py-6">
                                                    <div className="font-semibold text-[15px] text-text-primary-light dark:text-text-primary-dark">
                                                        {kpi.name}
                                                    </div>
                                                    <div className="text-[13px] text-text-muted-light dark:text-text-muted-dark font-medium mt-1 tracking-wide">
                                                        {kpi.category}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-6 flex justify-center">
                                                    <input
                                                        type="number"
                                                        value={kpi.weight}
                                                        onChange={(e) => handleWeightChange(kpi.kpiLibraryId, Number(e.target.value))}
                                                        className="w-20 px-3 py-2 text-center bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm font-semibold text-text-primary-light dark:text-text-primary-dark shadow-sm focus-ring"
                                                    />
                                                </td>
                                                <td className="px-5 py-6">
                                                    <div className="text-[14px] text-text-secondary-light dark:text-text-secondary-dark font-medium pr-4">
                                                        {kpi.description}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-6 text-right">
                                                    <button
                                                        onClick={() => setStructureDetails(prev => prev.filter(d => d.kpiLibraryId !== kpi.kpiLibraryId))}
                                                        className="text-text-muted-light dark:text-text-muted-dark hover:text-red-500 transition-colors cursor-pointer"
                                                    >
                                                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalKpiPages > 1 && (
                                <div className="px-5 py-3 border-t border-border-light dark:border-border-dark flex items-center justify-between">
                                    <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                                        Showing {(kpiPage - 1) * KPI_PAGE_SIZE + 1}–{Math.min(kpiPage * KPI_PAGE_SIZE, filteredDisplayKpis.length)} of {filteredDisplayKpis.length} KPIs
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setKpiPage(p => Math.max(1, p - 1))}
                                            disabled={kpiPage === 1}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-2-light dark:hover:bg-surface-2-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            ← Prev
                                        </button>
                                        {Array.from({ length: totalKpiPages }, (_, i) => i + 1).map(pg => (
                                            <button
                                                key={pg}
                                                onClick={() => setKpiPage(pg)}
                                                className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${pg === kpiPage
                                                    ? 'bg-primary text-white shadow-sm'
                                                    : 'border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-2-light dark:hover:bg-surface-2-dark'
                                                    }`}
                                            >
                                                {pg}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setKpiPage(p => Math.min(totalKpiPages, p + 1))}
                                            disabled={kpiPage === totalKpiPages}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-2-light dark:hover:bg-surface-2-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>{/* close KPI structure card */}

                        {/* Action Bar */}
                        <div className="pt-2 flex justify-center gap-4">
                            <button
                                onClick={handleSaveDraft}
                                className="px-6 py-2.5 rounded-lg text-sm font-bold border border-primary text-primary hover:bg-primary/5 transition-colors shadow-sm bg-surface-light dark:bg-surface-dark"
                            >
                                Save Draft
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={currentTotalWeight > 100}
                                title={currentTotalWeight > 100 ? `Total weight is ${currentTotalWeight}% — must be ≤ 100%` : ''}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm ${currentTotalWeight > 100
                                    ? 'bg-red-500 text-white cursor-not-allowed opacity-70'
                                    : 'bg-primary text-white hover:bg-primary-hover'
                                    }`}
                            >
                                {currentTotalWeight > 100 ? `Weight ${currentTotalWeight}% — Fix before Publish` : 'Publish to Employees'}
                            </button>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-80 flex-shrink-0 space-y-6">
                        {/* Department Directory */}
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden flex flex-col bento-card">
                            <div className="px-5 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                                <h2 className="text-sm font-bold font-heading text-text-primary-light dark:text-text-primary-dark">
                                    Department Directory
                                </h2>

                            </div>
                            <div className="p-2 space-y-1">
                                {departments.length === 0 ? (
                                    <div className="text-center text-xs text-text-muted-light dark:text-text-muted-dark py-4">No departments found.</div>
                                ) : departments.map((dept) => (
                                    <div
                                        key={dept.id}
                                        onClick={() => setSelectedDeptId(dept.id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors relative overflow-hidden group
                                            ${selectedDeptId === dept.id
                                                ? "bg-primary/5 border border-primary/20"
                                                : "border border-transparent hover:bg-surface-2-light dark:hover:bg-surface-2-dark"
                                            }
                                        `}
                                    >
                                        {selectedDeptId === dept.id && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>
                                        )}

                                        <div className="w-9 h-9 rounded-lg bg-surface-2-light dark:bg-surface-2-dark flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark flex-shrink-0">
                                            {selectedDeptId === dept.id ? <span className="text-primary">{Icons.building}</span> : Icons.building}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark truncate pr-2">
                                                {dept.name}
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0 px-1">
                                            {selectedDeptId === dept.id && Icons.dotGreen}
                                        </div>
                                    </div>
                                ))}
                            </div>


                        </div>


                    </div>
                </div>
            )}

            {/* ─── REVIEW CYCLE VIEW ──────────────────────────────────────────── */}
            {viewMode === "cycles" && (
                <div className="flex flex-col gap-6 animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold font-heading text-text-primary-light dark:text-text-primary-dark">Review Cycle Configuration</h2>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">Define evaluation periods, deadlines and criteria for structured performance reviews.</p>
                        </div>
                        <button
                            onClick={openNewCycleModal}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                            New Cycle
                        </button>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-5">
                        {[{
                            label: 'Total Cycles', value: cycles.length, color: 'text-text-primary-light dark:text-text-primary-dark'
                        }, {
                            label: 'Active', value: cycles.filter(c => c.status === 'ACTIVE').length, color: 'text-primary'
                        }, {
                            label: 'Closed', value: cycles.filter(c => c.status === 'CLOSED').length, color: 'text-text-muted-light dark:text-text-muted-dark'
                        }].map((s, i) => (
                            <div key={i} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm">
                                <p className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-2">{s.label}</p>
                                <p className={`text-4xl font-bold font-heading ${s.color}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Cycle Table */}
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border-light dark:border-border-dark bg-surface-2-light/60 dark:bg-surface-2-dark/60">
                                    {['Cycle Name', 'Period', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-5 py-3.5 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                {cyclesLoading ? (
                                    <tr><td colSpan={4} className="px-5 py-8 text-center text-text-muted-light">Loading cycles...</td></tr>
                                ) : cycles.length === 0 ? (
                                    <tr><td colSpan={4} className="px-5 py-10 text-center">
                                        <div className="text-text-muted-light dark:text-text-muted-dark">
                                            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <p className="text-sm font-semibold">No review cycles yet.</p>
                                            <p className="text-xs mt-1">Click "New Cycle" to get started.</p>
                                        </div>
                                    </td></tr>
                                ) : cycles.map(cycle => {
                                    const statusColors: Record<string, string> = {
                                        ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                                        CLOSED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                                    };
                                    return (
                                        <tr key={cycle.cycleId} className="hover:bg-surface-2-light/50 dark:hover:bg-surface-2-dark/50 transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-sm text-text-primary-light dark:text-text-primary-dark">{cycle.cycleName}</p>
                                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                                                    Created {cycle.createdAt ? new Date(cycle.createdAt).toLocaleDateString('vi-VN') : '—'}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                                <p className="font-semibold">{cycle.startDate} → {cycle.endDate}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${statusColors[cycle.status] || ''}`}>
                                                    {cycle.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    {cycle.status === 'ACTIVE' && (
                                                        <button
                                                            onClick={() => openEditCycleModal(cycle)}
                                                            className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
                                                            title="Edit"
                                                        >
                                                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
                                                        </button>
                                                    )}
                                                    {cycle.status === 'ACTIVE' && (
                                                        <button
                                                            onClick={() => handleCycleStatusChange(cycle, 'CLOSED')}
                                                            className="px-3 py-1.5 text-[11px] font-bold bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                                        >
                                                            Close
                                                        </button>
                                                    )}
                                                    {cycle.status === 'CLOSED' && (
                                                        <span className="text-xs text-text-muted-light dark:text-text-muted-dark italic">Archived</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {/* Add KPI Modal Overlay */}
            {isAddKpiModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-surface-2-light/50 dark:bg-surface-2-dark/50">
                            <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark font-heading">
                                Add KPI to Department
                            </h2>
                            <button
                                onClick={() => setIsAddKpiModalOpen(false)}
                                className="text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light transition-colors"
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex px-6 pt-4 space-x-4 border-b border-border-light dark:border-border-dark">
                            <button
                                onClick={() => setModalTab('library')}
                                className={`pb-2 text-sm font-semibold transition-colors ${modalTab === 'library' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'}`}
                            >
                                From Library
                            </button>
                            <button
                                onClick={() => setModalTab('new')}
                                className={`pb-2 text-sm font-semibold transition-colors ${modalTab === 'new' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'}`}
                            >
                                Create New KPI
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {modalTab === 'library' ? (
                                availableKpis.length === 0 ? (
                                    <div className="text-center text-text-muted-light dark:text-text-muted-dark py-10">
                                        No available KPIs to add. All existing KPIs from the Library have been assigned to this department!
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {availableKpis.map(kpi => (
                                            <div key={kpi.libId} className="flex justify-between items-center p-4 border border-border-light dark:border-border-dark rounded-lg hover:bg-surface-2-light dark:hover:bg-surface-2-dark transition-colors">
                                                <div>
                                                    <div className="font-bold text-text-primary-light dark:text-text-primary-dark">{kpi.name}</div>
                                                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{kpi.category}</div>
                                                    {kpi.description && <div className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">{kpi.description}</div>}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        handleAddKpi(kpi);
                                                        setIsAddKpiModalOpen(false);
                                                    }}
                                                    className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold rounded-lg transition-colors border border-primary/20 shrink-0"
                                                >
                                                    Add (Weight {kpi.defaultWeight}%)
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1">KPI Name</label>
                                        <input
                                            type="text"
                                            value={newKpi.name}
                                            onChange={e => setNewKpi({ ...newKpi, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus-ring"
                                            placeholder="e.g. Sales Target Completion"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1">Category</label>
                                            <select
                                                value={newKpi.category}
                                                onChange={e => setNewKpi({ ...newKpi, category: e.target.value })}
                                                className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus-ring"
                                            >
                                                {KPI_CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1">Default Weight</label>
                                            <input
                                                type="number"
                                                value={newKpi.defaultWeight}
                                                onChange={e => setNewKpi({ ...newKpi, defaultWeight: Number(e.target.value) })}
                                                className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus-ring"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1">Description (Optional)</label>
                                        <textarea
                                            value={newKpi.description}
                                            onChange={e => setNewKpi({ ...newKpi, description: e.target.value })}
                                            className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus-ring"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="pt-2 flex justify-end">
                                        <button
                                            onClick={handleCreateAndAddKpi}
                                            disabled={!newKpi.name || !newKpi.category}
                                            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-hover disabled:opacity-50"
                                        >
                                            Create & Assign
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-border-light dark:border-border-dark bg-surface-2-light/50 dark:bg-surface-2-dark/50 flex justify-end">
                            <button
                                onClick={() => setIsAddKpiModalOpen(false)}
                                className="px-6 py-2 rounded-lg text-sm font-bold border border-border-light dark:border-border-dark hover:bg-surface-3-light dark:hover:bg-surface-3-dark transition-colors text-text-primary-light dark:text-text-primary-dark"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── CREATE / EDIT CYCLE MODAL ─────────────────────────────────── */}
            {showCycleModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
                            <h3 className="text-lg font-bold font-heading text-text-primary-light dark:text-text-primary-dark">
                                {editingCycle ? '✏️ Edit Review Cycle' : '🗓️ Create New Review Cycle'}
                            </h3>
                            <button onClick={() => setShowCycleModal(false)} className="text-text-muted-light hover:text-text-primary-light transition-colors">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5 overflow-y-auto">
                            {cycleError && (
                                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 font-medium">
                                    {cycleError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1.5">Cycle Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={cycleForm.cycleName}
                                    onChange={e => setCycleForm(f => ({ ...f, cycleName: e.target.value }))}
                                    placeholder="e.g. Q1 2026 Performance Review"
                                    className="w-full px-4 py-2.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1.5">Start Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        value={cycleForm.startDate}
                                        onChange={e => setCycleForm(f => ({ ...f, startDate: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1.5">End Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        value={cycleForm.endDate}
                                        onChange={e => setCycleForm(f => ({ ...f, endDate: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-light dark:border-border-dark bg-surface-2-light/40 dark:bg-surface-2-dark/40">
                            <button
                                onClick={() => setShowCycleModal(false)}
                                className="px-5 py-2 text-sm font-semibold border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark rounded-lg hover:bg-surface-2-light dark:hover:bg-surface-2-dark transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCycle}
                                disabled={cycleSaving}
                                className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center gap-2"
                            >
                                {cycleSaving && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                                {cycleSaving ? 'Saving...' : editingCycle ? 'Save Changes' : 'Create Cycle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRPerformance;
