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

const EmployeePerformance = ({ setActiveTab }: { setActiveTab: (t: string) => void }) => {
    const [kpis, setKpis] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [currentResult, setCurrentResult] = useState<string>('');
    const [comments, setComments] = useState<string>('');
    const [attachedFiles, setAttachedFiles] = useState<any[]>([
        { name: 'Q3_Adoption_Metrics.pdf', size: '2.4 MB', time: 'Uploaded 2h ago' },
        { name: 'User_Survey_Screenshot.png', size: '1.1 MB', time: 'Uploaded 2h ago' }
    ]);

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
                const formatted = goals.map(g => ({
                    id: g.goalId,
                    name: g.title || g.kpiLibrary?.name || "Untitled Goal",
                    measurement: g.kpiLibrary?.description || "Meet quarterly targets",
                    weight: g.weight || 10,
                    status: g.status || 'NEW',
                    target: g.targetValue || 100,
                    actual: g.actualValue || 0,
                    category: g.kpiLibrary?.category || "OPERATIONAL"
                }));
                setKpis(formatted);
                if (formatted.length > 0) {
                    setSelectedGoalId(formatted[0].id);
                    setCurrentResult(String(formatted[0].actual));
                }
            } catch (error) {
                console.error("Failed to load goals", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGoals();
    }, []);

    const selectedGoal = useMemo(() => {
        return kpis.find(k => k.id === selectedGoalId);
    }, [kpis, selectedGoalId]);

    const progressPercentage = useMemo(() => {
        if (!selectedGoal || !selectedGoal.target) return 0;
        const val = parseFloat(currentResult) || 0;
        return Math.min(Math.round((val / selectedGoal.target) * 100), 100);
    }, [selectedGoal, currentResult]);

    const handleAcknowledge = async (id: string) => {
        try {
            // Mock API call – backend needs correct implementation
            setKpis(prev => prev.map(k => k.id === id ? { ...k, status: 'ACTIVE' } : k));
            alert("Goal acknowledged successfully!");
        } catch (e) {
            alert("Failed to acknowledge goal.");
        }
    };

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
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${kpi.status === 'NEW'
                                            ? 'bg-amber-100 text-amber-600 border border-amber-200'
                                            : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                                            }`}>
                                            {kpi.status === 'NEW' ? 'New' : 'Active'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        {kpi.status === 'NEW' ? (
                                            <button
                                                onClick={() => handleAcknowledge(kpi.id)}
                                                className="px-5 py-2.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                                            >
                                                Acknowledge
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { setSelectedGoalId(kpi.id); setCurrentResult(String(kpi.actual)); }}
                                                className="text-primary hover:underline text-xs font-black uppercase tracking-widest"
                                            >
                                                Update Progress
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Update Progress Section */}
            <div className="space-y-4 pt-4">
                <div className="space-y-1">
                    <h2 className="text-lg font-black text-text-primary-light uppercase tracking-tight">Update My Progress</h2>
                    <p className="text-xs text-text-muted-light font-medium uppercase tracking-wide">Update current results and upload supporting documentation for the selected goal.</p>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-border-light rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row gap-10 bento-card">
                    {/* Progress Form */}
                    <div className="flex-[1.2] space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-text-muted-light tracking-widest">Selected Goal</label>
                            <div className="w-full px-5 py-4 bg-surface-2-light/50 border border-border-light rounded-2xl text-sm font-bold text-text-primary-light">
                                {selectedGoal?.name || "None selected"}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-text-muted-light tracking-widest">Target Value</label>
                                <div className="w-full px-5 py-4 bg-primary/5 border border-primary/10 rounded-2xl text-sm font-black text-primary italic">
                                    {selectedGoal?.target || 0} Adoption
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-text-muted-light tracking-widest">Current Result</label>
                                <input
                                    type="number"
                                    value={currentResult}
                                    onChange={(e) => setCurrentResult(e.target.value)}
                                    className="w-full px-5 py-4 bg-white border border-border-light focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl text-sm font-black transition-all outline-none"
                                    placeholder="Enter current value"
                                />
                            </div>
                        </div>

                        {/* Progress Bar Visualization */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-[10px] font-black uppercase text-text-muted-light tracking-widest">Progress Overview</label>
                                <span className="text-xl font-black text-emerald-500">{progressPercentage}%</span>
                            </div>
                            <div className="h-4 w-full bg-surface-2-light rounded-full overflow-hidden border border-border-light shadow-inner p-1">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(16,185,129,0.3)] relative"
                                    style={{ width: `${progressPercentage}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-text-muted-light/60 italic">
                                You are currently {100 - progressPercentage}% away from your quarterly target.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-text-muted-light tracking-widest">Self-Assessment Comments</label>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                className="w-full px-5 py-4 bg-white border border-border-light focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl text-sm font-medium transition-all outline-none min-h-[140px]"
                                placeholder="Describe your achievements, challenges, and next steps..."
                            />
                        </div>
                    </div>

                    {/* Evidence & File Upload */}
                    <div className="flex-1 space-y-6">
                        <label className="text-[10px] font-black uppercase text-text-muted-light tracking-widest mb-2 block">Evidence & Supporting Documents</label>

                        <div className="border-2 border-dashed border-border-light bg-surface-2-light/20 rounded-3xl p-10 flex flex-col items-center justify-center text-center group hover:border-primary hover:bg-primary/[0.02] transition-all cursor-pointer">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                {Icons.upload}
                            </div>
                            <h3 className="text-sm font-black text-text-primary-light mb-1">Click or drag to upload</h3>
                            <p className="text-[10px] font-bold text-text-muted-light uppercase tracking-tight">PDF, PNG, JPG or CSV (Max 10MB each)</p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-text-muted-light tracking-widest">Attached Files ({attachedFiles.length})</span>
                            </div>
                            <div className="space-y-2">
                                {attachedFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 bg-white dark:bg-surface-dark border border-border-light rounded-2xl hover:shadow-md transition-all group">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            {Icons.file}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-text-primary-light truncate">{file.name}</div>
                                            <div className="text-[10px] font-bold text-text-muted-light uppercase tracking-wide mt-0.5">{file.size} • {file.time}</div>
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all">
                                            {Icons.trash}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-10 mt-auto">
                            <button className="px-6 py-4 border-2 border-border-light text-text-primary-light text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-surface-2-light transition-all">
                                Save Draft
                            </button>
                            <button className="px-6 py-4 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                                Submit Update
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeePerformance;
