import { kpiService } from "../services/kpiService";
import type { KpiLibrary, Department, KpiDetailDto } from "../services/kpiService";



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
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-text-muted-light opacity-50">
            <circle cx="10" cy="10" r="4" />
        </svg>
    ),
    cog: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-text-muted-light hover:text-primary transition-colors cursor-pointer">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
    ),
    search: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-text-muted-light cursor-pointer hover:text-primary transition-colors">
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

const HRPerformance = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
    const [allKpis, setAllKpis] = useState<KpiLibrary[]>([]);
    const [structureDetails, setStructureDetails] = useState<KpiDetailDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddKpiModalOpen, setIsAddKpiModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'library' | 'new'>('library');
    const [viewMode, setViewMode] = useState<"global" | "specific">("global");

    // New KPI Form State
    const [newKpi, setNewKpi] = useState({
        name: '',
        category: '',
        defaultWeight: 10,
        description: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            const [deptsData, kpisData] = await Promise.all([
                kpiService.getAllDepartments(),
                kpiService.getAllKpiLibraries()
            ]);

            if (kpisData) setAllKpis(kpisData);

            if (deptsData && deptsData.length > 0) {
                setDepartments(deptsData);
                setSelectedDeptId(deptsData[0].deptId);
            }
            setLoading(false);
        };
        fetchInitialData();
    }, []);

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
        try {
            await kpiService.assignKpisToDepartment({
                departmentId: selectedDeptId,
                details: structureDetails
            });
            alert("Saved KPI Structure successfully!");
        } catch (e) {
            alert("Error saving KPI Structure");
        }
    };

    const activeDepartment = useMemo(() => {
        return departments.find(d => d.deptId === selectedDeptId);
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

    const handleAddKpi = (kpi: KpiLibrary) => {
        setStructureDetails(prev => [...prev, { kpiLibraryId: kpi.libId, weight: kpi.defaultWeight }]);
    };

    const handleCreateAndAddKpi = async () => {
        try {
            const created = await kpiService.createKpiLibrary(newKpi);
            setAllKpis(prev => [...prev, created]);
            handleAddKpi(created);
            setIsAddKpiModalOpen(false);
            setNewKpi({ name: '', category: '', defaultWeight: 10, description: '' });
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
                    <h1 className="text-2xl font-bold font-heading text-text-primary-light tracking-tight">
                        Performance Module
                    </h1>
                    <p className="mt-0.5 text-sm text-text-secondary-light ">
                        Global KPI Structure Definition & Cross-department Review
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    {/* View Switcher (Global vs Specific) */}
                    <div className="flex bg-surface-2-light p-1 rounded-xl shadow-inner border border-border-light ">
                        <button
                            onClick={() => setViewMode("global")}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === "global"
                                ? "bg-white text-primary shadow-sm"
                                : "text-text-muted-light hover:text-text-primary-light"
                                }`}
                        >
                            🌍 Global
                        </button>
                        <button
                            onClick={() => setViewMode("specific")}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === "specific"
                                ? "bg-white text-primary shadow-sm"
                                : "text-text-muted-light hover:text-text-primary-light"
                                }`}
                        >
                            🎯 Specific
                        </button>
                    </div>

                    <div className="flex items-center bg-surface-light p-1 rounded-xl shadow-sm border border-border-light ">
                        <button
                            onClick={() => setActiveTab("hr")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "hr"
                                ? "bg-primary text-white shadow-sm"
                                : "text-text-secondary-light hover:text-text-primary-light"
                                }`}
                        >
                            HR Config
                        </button>
                        <button
                            onClick={() => setActiveTab("manager")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === "manager"
                                ? "bg-surface-light text-text-primary-light shadow-sm"
                                : "text-text-secondary-light hover:bg-surface-2-light "
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
                    <div className="grid grid-cols-4 gap-5">
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5 shadow-sm bento-card">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
                                Org Average Score
                            </h3>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold font-heading text-primary">84.5</span>
                                <span className="text-sm font-bold text-green-500 mb-1">+2.4%</span>
                            </div>
                        </div>
                        <div className="bg-surface-light border border-border-light rounded-xl p-5 shadow-sm bento-card">
                            <h3 className="text-xs font-bold text-text-muted-light uppercase tracking-widest mb-2">
                                Total KPIs Assigned
                            </h3>
                            <span className="text-3xl font-bold font-heading">1,250</span>
                        </div>
                        <div className="bg-surface-light border border-border-light rounded-xl p-5 shadow-sm bento-card">
                            <h3 className="text-xs font-bold text-text-muted-light uppercase tracking-widest mb-2">
                                Employees Evaluated
                            </h3>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold font-heading">78%</span>
                                <span className="text-sm font-medium text-text-secondary-light mb-1">(450/575)</span>
                            </div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 shadow-sm bento-card">
                            <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Risk Alerts
                            </h3>
                            <span className="text-3xl font-bold font-heading text-red-600 ">14</span>
                            <p className="text-xs text-red-600/70 font-medium mt-1">Staff underperforming</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Department Leaderboard */}
                        <div className="bg-surface-light border border-border-light rounded-xl shadow-sm p-5 bento-card">
                            <h2 className="text-sm font-bold font-heading text-text-primary-light mb-6">
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
                                        <div className="h-2.5 w-full bg-surface-2-light rounded-full overflow-hidden">
                                            <div className={`h-full ${dept.color} rounded-full transition-all duration-1000`} style={{ width: `${dept.score}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bell Curve Mock (Score Distribution) */}
                        <div className="bg-surface-light border border-border-light rounded-xl shadow-sm p-5 bento-card flex flex-col">
                            <h2 className="text-sm font-bold font-heading text-text-primary-light mb-6">
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
                            <div className="bg-surface-light border border-border-light rounded-xl p-5 shadow-sm bento-card">
                                <h3 className="text-xs font-bold text-text-muted-light uppercase tracking-widest mb-3">
                                    Library Utilization
                                </h3>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-3xl font-bold font-heading">
                                        {allKpis.length > 0 ? Math.round((structureDetails.length / allKpis.length) * 100) : 0}%
                                    </span>
                                    <span className="text-sm font-medium text-text-secondary-light ">
                                        of global KPIs used here
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-surface-2-light rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${allKpis.length > 0 ? (structureDetails.length / allKpis.length) * 100 : 0}%` }}></div>
                                </div>
                            </div>

                            {/* Departments Pendng Review */}
                            <div className="bg-surface-light border border-border-light rounded-xl p-5 shadow-sm bento-card">
                                <h3 className="text-xs font-bold text-text-muted-light uppercase tracking-widest mb-3">
                                    Total Departments
                                </h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold font-heading">{departments.length}</span>
                                    <span className="text-sm font-medium text-text-secondary-light ml-1">Listed in system</span>
                                </div>
                            </div>

                            {/* Global Weight Total */}
                            <div className="bg-surface-light border border-border-light rounded-xl p-5 shadow-sm bento-card flex flex-col">
                                <h3 className="text-xs font-bold text-text-muted-light uppercase tracking-widest mb-3 whitespace-nowrap overflow-hidden text-ellipsis">
                                    Total Weight Configured
                                </h3>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className={`text-3xl font-bold font-heading ${currentTotalWeight === 100 ? 'text-primary' : currentTotalWeight > 100 ? 'text-red-500' : 'text-accent-amber'}`}>
                                        {currentTotalWeight}%
                                    </span>
                                    <span className="text-sm font-medium text-text-secondary-light ml-1">
                                        {currentTotalWeight === 100 ? "Perfectly balanced" : currentTotalWeight > 100 ? "Over 100%!" : "Needs more KPIs"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* KPI Structure Definition Header */}
                        <div className="bg-surface-light border border-border-light rounded-xl shadow-sm overflow-hidden flex flex-col">
                            <div className="px-5 py-4 border-b border-border-light flex items-center justify-between bg-surface-light ">
                                <div>
                                    <h2 className="text-lg font-bold font-heading text-text-primary-light ">
                                        KPI Structure Definition:
                                    </h2>
                                    <h2 className="text-lg font-bold font-heading text-primary">
                                        {activeDepartment ? activeDepartment.deptName : "N/A"}
                                    </h2>
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
                                        <tr className="border-b border-border-light ">
                                            <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light uppercase tracking-widest w-[35%]">
                                                KPI Item & Category
                                            </th>
                                            <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light uppercase tracking-widest w-[20%] text-center">
                                                Mandatory Weight (%)
                                            </th>
                                            <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light uppercase tracking-widest w-[35%]">
                                                Measurement Logic
                                            </th>
                                            <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light uppercase tracking-widest text-right">
                                                Settings
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-light ">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-6 text-center text-text-muted-light ">
                                                    Loading KPIs...
                                                </td>
                                            </tr>
                                        ) : displayKpis.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-6 text-center text-text-muted-light ">
                                                    No KPIs assigned to this department yet.
                                                </td>
                                            </tr>
                                        ) : displayKpis.map((kpi) => (
                                            <tr key={kpi.kpiLibraryId} className="table-row-hover hover:bg-surface-2-light/50 p-2">
                                                <td className="px-5 py-6">
                                                    <div className="font-semibold text-[15px] text-text-primary-light ">
                                                        {kpi.name}
                                                    </div>
                                                    <div className="text-[13px] text-text-muted-light font-medium mt-1 tracking-wide">
                                                        {kpi.category}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-6 flex justify-center">
                                                    <input
                                                        type="number"
                                                        value={kpi.weight}
                                                        onChange={(e) => handleWeightChange(kpi.kpiLibraryId, Number(e.target.value))}
                                                        className="w-20 px-3 py-2 text-center bg-surface-light border border-border-light rounded-lg text-sm font-semibold text-text-primary-light shadow-sm focus-ring"
                                                    />
                                                </td>
                                                <td className="px-5 py-6">
                                                    <div className="text-[14px] text-text-secondary-light font-medium pr-4">
                                                        {kpi.description}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-6 text-right">
                                                    <button
                                                        onClick={() => setStructureDetails(prev => prev.filter(d => d.kpiLibraryId !== kpi.kpiLibraryId))}
                                                        className="text-text-muted-light hover:text-red-500 transition-colors cursor-pointer"
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
                        </div>


                        {/* Action Bar (Mocked partial cut off at bottom) */}
                        <div className="pt-2 flex justify-center gap-4">
                            <button className="px-6 py-2.5 rounded-lg text-sm font-bold border border-border-light hover:bg-surface-2-light transition-colors text-text-primary-light shadow-sm">
                                ...
                            </button>
                            <button className="px-6 py-2.5 rounded-lg text-sm font-bold border border-primary text-primary hover:bg-primary/5 transition-colors shadow-sm bg-surface-light ">
                                Save Draft
                            </button>
                            <button className="px-6 py-2.5 rounded-lg text-sm font-bold border border-primary text-primary hover:bg-primary/5 transition-colors shadow-sm bg-surface-light ">
                                Publish Template
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2.5 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary-hover transition-colors shadow-sm">
                                Publish All
                            </button>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-80 flex-shrink-0 space-y-6">
                        {/* Department Directory */}
                        <div className="bg-surface-light border border-border-light rounded-xl shadow-sm overflow-hidden flex flex-col bento-card">
                            <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
                                <h2 className="text-sm font-bold font-heading text-text-primary-light ">
                                    Department Directory
                                </h2>
                                {Icons.search}
                            </div>
                            <div className="p-2 space-y-1">
                                {departments.length === 0 ? (
                                    <div className="text-center text-xs text-text-muted-light py-4">No departments found.</div>
                                ) : departments.map((dept) => (
                                    <div
                                        key={dept.deptId}
                                        onClick={() => setSelectedDeptId(dept.deptId)}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors relative overflow-hidden group
 ${selectedDeptId === dept.deptId
                                                ? "bg-primary/5 border border-primary/20"
                                                : "border border-transparent hover:bg-surface-2-light "
                                            }
 `}
                                    >
                                        {selectedDeptId === dept.deptId && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>
                                        )}

                                        <div className="w-9 h-9 rounded-lg bg-surface-2-light flex items-center justify-center text-text-secondary-light flex-shrink-0">
                                            {selectedDeptId === dept.deptId ? <span className="text-primary">{Icons.building}</span> : Icons.building}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-text-primary-light truncate pr-2">
                                                {dept.deptName}
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0 px-1">
                                            {selectedDeptId === dept.deptId && Icons.dotGreen}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-border-light bg-surface-2-light/50 flex justify-center mt-1">
                                <button className="text-xs font-bold text-text-secondary-light hover:text-primary tracking-widest uppercase transition-colors flex items-center gap-2">
                                    {Icons.building} ADD DEPARTMENT
                                </button>
                            </div>
                        </div>


                    </div>
                </div>
            )}

            {/* Add KPI Modal Overlay */}
            {isAddKpiModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-surface-light border border-border-light rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-border-light flex justify-between items-center bg-surface-2-light/50 ">
                            <h2 className="text-lg font-bold text-text-primary-light font-heading">
                                Add KPI to Department
                            </h2>
                            <button
                                onClick={() => setIsAddKpiModalOpen(false)}
                                className="text-text-muted-light hover:text-text-primary-light transition-colors"
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex px-6 pt-4 space-x-4 border-b border-border-light ">
                            <button
                                onClick={() => setModalTab('library')}
                                className={`pb-2 text-sm font-semibold transition-colors ${modalTab === 'library' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary-light hover:text-text-primary-light'}`}
                            >
                                From Library
                            </button>
                            <button
                                onClick={() => setModalTab('new')}
                                className={`pb-2 text-sm font-semibold transition-colors ${modalTab === 'new' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary-light hover:text-text-primary-light'}`}
                            >
                                Create New KPI
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {modalTab === 'library' ? (
                                availableKpis.length === 0 ? (
                                    <div className="text-center text-text-muted-light py-10">
                                        No available KPIs to add. All existing KPIs from the Library have been assigned to this department!
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {availableKpis.map(kpi => (
                                            <div key={kpi.libId} className="flex justify-between items-center p-4 border border-border-light rounded-lg hover:bg-surface-2-light transition-colors">
                                                <div>
                                                    <div className="font-bold text-text-primary-light ">{kpi.name}</div>
                                                    <div className="text-sm text-text-secondary-light ">{kpi.category}</div>
                                                    {kpi.description && <div className="text-xs text-text-muted-light mt-1">{kpi.description}</div>}
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
                                        <label className="block text-sm font-bold text-text-primary-light mb-1">KPI Name</label>
                                        <input
                                            type="text"
                                            value={newKpi.name}
                                            onChange={e => setNewKpi({ ...newKpi, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-sm text-text-primary-light focus-ring"
                                            placeholder="e.g. Sales Target Completion"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-bold text-text-primary-light mb-1">Category</label>
                                            <input
                                                type="text"
                                                value={newKpi.category}
                                                onChange={e => setNewKpi({ ...newKpi, category: e.target.value })}
                                                className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-sm text-text-primary-light focus-ring"
                                                placeholder="e.g. Revenue"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-sm font-bold text-text-primary-light mb-1">Default Weight</label>
                                            <input
                                                type="number"
                                                value={newKpi.defaultWeight}
                                                onChange={e => setNewKpi({ ...newKpi, defaultWeight: Number(e.target.value) })}
                                                className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-sm text-text-primary-light focus-ring"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-text-primary-light mb-1">Description (Optional)</label>
                                        <textarea
                                            value={newKpi.description}
                                            onChange={e => setNewKpi({ ...newKpi, description: e.target.value })}
                                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-sm text-text-primary-light focus-ring"
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
                        <div className="px-6 py-4 border-t border-border-light bg-surface-2-light/50 flex justify-end">
                            <button
                                onClick={() => setIsAddKpiModalOpen(false)}
                                className="px-6 py-2 rounded-lg text-sm font-bold border border-border-light hover:bg-surface-3-light transition-colors text-text-primary-light "
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRPerformance;