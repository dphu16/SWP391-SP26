import { useState, useEffect, useMemo } from "react";
import { kpiService } from "../services/kpiService";
import { getToken } from "../services/authService";
import { decodeJwt } from "../utils/jwtDecode";

const Icons = {
    // ... existing icons ...
    checkCircle: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-500">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
    ),
    upload: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-primary/40">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    ),
    file: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary/60">
            <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
        </svg>
    ),
    trash: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark hover:text-red-500 transition-colors">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
        </svg>
    )
};

const EmployeePerformance = () => {
    const [kpis, setKpis] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<Record<string, string>>({});
    const [goalComments, setGoalComments] = useState<Record<string, string>>({});
    const [submitLoading, setSubmitLoading] = useState<Record<string, boolean>>({});
    const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});

    // Get real employee ID from session
    const employeeId = useMemo(() => {
        const token = getToken();
        return token ? decodeJwt(token)?.employeeId : null;
    }, []);

    useEffect(() => {
        if (!employeeId) return;
        const fetchGoals = async () => {
            setLoading(true);
            try {
                const goals = await kpiService.getGoalsByEmployee(employeeId);
                const formatted = goals.map((g: any) => ({
                    id: g.goalId,
                    name: g.title || g.kpiLibrary?.name || "Untitled Goal",
                    measurement: g.kpiLibrary?.description || "",
                    weight: g.weight || 0,
                    status: g.status,
                    target: g.targetValue || 0,
                    actual: g.currentValue || 0,
                    category: g.kpiLibrary?.category || "N/A"
                }));
                setKpis(formatted);

                // Initialize input maps
                const resMap: Record<string, string> = {};
                const comMap: Record<string, string> = {};
                formatted.forEach(f => {
                    resMap[f.id] = String(f.actual || '');
                    comMap[f.id] = '';
                });
                setResults(resMap);
                setGoalComments(comMap);
            } catch (error) {
                console.error("Failed to load goals", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGoals();
    }, []);

    const getProgressPercentage = (goalId: string, currentVal: string) => {
        const goal = kpis.find(k => k.id === goalId);
        if (!goal || !goal.target) return 0;
        const val = parseFloat(currentVal) || 0;
        return Math.min(Math.round((val / goal.target) * 100), 100);
    };

    const fetchGoalsForEmployee = async (silent = false) => {
        if (!employeeId) return;
        if (!silent) setLoading(true);
        try {
            const goals = await kpiService.getGoalsByEmployee(employeeId);
            const formatted = goals.map((g: any) => ({
                id: g.goalId,
                name: g.title || g.kpiLibrary?.name || "Untitled Goal",
                measurement: g.kpiLibrary?.description || "",
                weight: g.weight || 0,
                status: g.status,
                target: g.targetValue || 0,
                actual: g.currentValue || 0,
                category: g.kpiLibrary?.category || "N/A"
            }));

            setKpis(formatted);

            // Synchronize results map if needed (prevent current values from resetting)
            setResults(prev => {
                const newRes = { ...prev };
                formatted.forEach(f => {
                    if (!(f.id in newRes)) newRes[f.id] = String(f.actual || '');
                });
                return newRes;
            });
        } catch (error) {
            console.error("Failed to load goals", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleAcknowledge = async (id: string) => {
        try {
            await kpiService.updateEmployeeGoalStatus(id, 'ACKNOWLEDGED');
            // Optimistic update to UI state immediately
            setKpis(prev => prev.map(k => k.id === id ? { ...k, status: 'ACKNOWLEDGED' } : k));
            // Silent refresh in background to ensure data sync
            await fetchGoalsForEmployee(true);
        } catch (e) {
            alert("Failed to acknowledge goal.");
        }
    };

    const handleFileChange = (goalId: string, file: File | null) => {
        setSelectedFiles(prev => ({ ...prev, [goalId]: file }));
    };

    const handleProgressUpdate = async (goalId: string) => {
        const res = results[goalId];
        const comm = goalComments[goalId];
        const file = selectedFiles[goalId];

        setSubmitLoading(prev => ({ ...prev, [goalId]: true }));
        try {
            let uploadedUrl = '';
            if (file) {
                uploadedUrl = await kpiService.uploadFile(file);
            }

            await kpiService.updateGoalProgress(goalId, {
                actualValue: Number(res),
                comment: comm,
                imageUrl: uploadedUrl || undefined
            });
            await fetchGoalsForEmployee(true);
            alert("Progress record updated successfully!");
        } catch (e: any) {
            alert(e?.response?.data || "Failed to update progress");
        } finally {
            setSubmitLoading(prev => ({ ...prev, [goalId]: false }));
        }
    };

    if (loading) return <div className="p-20 text-center font-black opacity-20 uppercase tracking-[0.2em] animate-pulse">Loading My Performance...</div>;

    return (
        <div className="flex flex-col h-full space-y-8 animate-fade-in font-sans pb-10">
            {/* Header & Breadcrumb */}
            <div className="space-y-1">
                <nav className="flex text-xs font-bold text-text-muted-light uppercase tracking-widest gap-2">
                    <span className="hover:text-primary transition-colors cursor-pointer">Employee Self-Service</span>
                    <span className="opacity-30">/</span>
                    <span className="text-text-primary-light">My Learning & Goals</span>
                </nav>
                <div className="flex items-center justify-between pt-2">
                    <div>
                        <h1 className="text-3xl font-black text-text-primary-light dark:text-text-primary-dark tracking-tight">
                            My KPI & Progress Update
                        </h1>
                        <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark max-w-2xl leading-relaxed">
                            Review your current performance targets and submit evidence of your quarterly progress to your manager.
                        </p>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        Submit Final Review
                    </button>
                </div>
            </div>

            {/* KPI List Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-text-primary-light uppercase tracking-tight flex items-center gap-3">
                        My KPI List
                        <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full">{kpis.length} Total Goals</span>
                    </h2>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-xl overflow-hidden bento-card">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-2-light/30 dark:bg-surface-2-dark/30 border-b border-border-light dark:border-border-dark">
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em]">Goal Name</th>
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em]">Measurement Rule</th>
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em] text-center">Weight</th>
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em] text-center">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {kpis.map((kpi) => (
                                <tr key={kpi.id} className="group hover:bg-primary/[0.02] transition-colors">
                                    <td className="px-6 py-6">
                                        <div className="font-bold text-[15px] text-text-primary-light group-hover:text-primary transition-colors">{kpi.name}</div>
                                        <div className="text-[11px] font-bold text-text-muted-light uppercase mt-1">Focus: {kpi.category}</div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="text-sm text-text-secondary-light font-medium max-w-sm">{kpi.measurement}</div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <span className="font-black text-sm">{kpi.weight}%</span>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${kpi.status === 'ASSIGNED'
                                            ? 'bg-blue-100 text-blue-600 border border-blue-200'
                                            : kpi.status === 'ACKNOWLEDGED'
                                                ? 'bg-amber-100 text-amber-600 border border-amber-200'
                                                : kpi.status === 'SUBMITTED'
                                                    ? 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                                                    : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                            }`}>
                                            {kpi.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        {kpi.status === 'ASSIGNED' ? (
                                            <button
                                                onClick={() => handleAcknowledge(kpi.id)}
                                                className="px-5 py-2.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                                            >
                                                Acknowledge
                                            </button>
                                        ) : (
                                            <a
                                                href={`#update-section-${kpi.id}`}
                                                className="text-primary hover:underline text-xs font-black uppercase tracking-widest"
                                            >
                                                Update Progress
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Update Progress Section */}
            <div className="space-y-6 pt-10 border-t border-border-light/10">
                <div className="space-y-1 text-center mb-10">
                    <h2 className="text-2xl font-black text-text-primary-light uppercase tracking-tight">Update My Progress</h2>
                    <p className="text-xs text-text-muted-light font-bold uppercase tracking-widest">Submit current results and evidence for all assigned KPIs</p>
                </div>

                <div className="grid grid-cols-1 gap-12">
                    {kpis.filter(k => k.status !== 'ASSIGNED').length === 0 ? (
                        <div className="p-20 bg-surface-2-light/30 rounded-3xl text-center border-2 border-dashed border-border-light">
                            <p className="text-sm font-bold text-text-muted-light uppercase tracking-widest">Please Acknowledge your KPIs first to enable updates.</p>
                        </div>
                    ) : kpis.filter(k => k.status !== 'ASSIGNED').map((kpi) => (
                        <div key={kpi.id} id={`update-section-${kpi.id}`} className="bg-white dark:bg-surface-dark border border-border-light rounded-[2.5rem] p-10 shadow-2xl flex flex-col xl:flex-row gap-12 bento-card relative overflow-hidden group hover:border-primary/30 transition-all">
                            {/* Watermark/Index */}
                            <div className="absolute -top-10 -right-10 text-[120px] font-black text-primary opacity-[0.03] select-none pointer-events-none group-hover:opacity-[0.06] transition-opacity">
                                {kpi.category.charAt(0)}
                            </div>

                            {/* Left: Input Fields */}
                            <div className="flex-[1.4] space-y-10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-12 bg-primary rounded-full"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{kpi.category}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-text-primary-light leading-tight">{kpi.name}</h3>
                                    <p className="text-sm text-text-secondary-light font-medium italic opacity-70">"{kpi.measurement}"</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-text-muted-light tracking-widest">Target Objective</label>
                                        <div className="px-6 py-5 bg-primary/5 border border-primary/10 rounded-2xl text-xl font-black text-primary italic">
                                            {kpi.target}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-text-muted-light tracking-widest">Current Actual Result</label>
                                        <input
                                            type="number"
                                            value={results[kpi.id] || ''}
                                            onChange={(e) => setResults(prev => ({ ...prev, [kpi.id]: e.target.value }))}
                                            disabled={kpi.status === 'COMPLETED'}
                                            className="w-full px-6 py-5 bg-surface-2-light/50 border border-border-light focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl text-xl font-black transition-all outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-black uppercase text-text-muted-light tracking-widest">Progress Visualization</label>
                                        <span className="text-2xl font-black text-emerald-500">{getProgressPercentage(kpi.id, results[kpi.id] || '0')}%</span>
                                    </div>
                                    <div className="h-4 w-full bg-surface-2-light rounded-full overflow-hidden border border-border-light shadow-inner p-1">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.4)] relative"
                                            style={{ width: `${getProgressPercentage(kpi.id, results[kpi.id] || '0')}%` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-text-muted-light tracking-widest">Self Assessment & Context</label>
                                    <textarea
                                        value={goalComments[kpi.id] || ''}
                                        onChange={(e) => setGoalComments(prev => ({ ...prev, [kpi.id]: e.target.value }))}
                                        disabled={kpi.status === 'COMPLETED'}
                                        className="w-full px-6 py-5 bg-surface-2-light/50 border border-border-light focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl text-sm font-medium transition-all outline-none min-h-[120px]"
                                        placeholder="Briefly explain your progress..."
                                    />
                                </div>
                            </div>

                            {/* Right: Evidence & Finalize */}
                            <div className="flex-1 flex flex-col bg-surface-2-light/30 rounded-[2rem] p-8 border border-border-light/50">
                                <label className="text-[10px] font-black uppercase text-text-muted-light tracking-widest mb-6 block">Evidence Documentation</label>

                                <div className="flex-1 flex flex-col">
                                    <input
                                        type="file"
                                        id={`file-upload-${kpi.id}`}
                                        className="hidden"
                                        onChange={(e) => handleFileChange(kpi.id, e.target.files?.[0] || null)}
                                        accept="image/*,.pdf"
                                    />
                                    <div
                                        onClick={() => document.getElementById(`file-upload-${kpi.id}`)?.click()}
                                        className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center group transition-all cursor-pointer mb-8 ${selectedFiles[kpi.id]
                                                ? 'border-emerald-500 bg-emerald-50/30'
                                                : 'border-border-light bg-white hover:border-primary'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${selectedFiles[kpi.id] ? 'bg-emerald-100' : 'bg-primary/10'
                                            }`}>
                                            {selectedFiles[kpi.id] ? Icons.checkCircle : Icons.upload}
                                        </div>
                                        <h4 className="text-xs font-black text-text-primary-light">
                                            {selectedFiles[kpi.id] ? selectedFiles[kpi.id]?.name : 'Upload Proof'}
                                        </h4>
                                        <p className="text-[9px] font-bold text-text-muted-light uppercase mt-1">
                                            {selectedFiles[kpi.id] ? 'File selected' : 'PDF/Images Max 10MB'}
                                        </p>
                                    </div>

                                    <div className="mt-auto space-y-4">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-text-muted-light mb-2">
                                            <span>Actions</span>
                                            <span className={`px-2 py-0.5 rounded-full ${kpi.status === 'SUBMITTED' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {kpi.status}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleProgressUpdate(kpi.id)}
                                            disabled={kpi.status === 'COMPLETED' || submitLoading[kpi.id]}
                                            className="w-full py-4 bg-emerald-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                                        >
                                            {submitLoading[kpi.id] ? 'Processing...' : 'Submit Progress'}
                                        </button>
                                        <button className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-text-primary-light opacity-40 hover:opacity-100 transition-all">
                                            Clear Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmployeePerformance;
