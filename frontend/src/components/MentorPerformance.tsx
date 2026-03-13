import { useState, useEffect, useMemo } from "react";
import { kpiService } from "../services/kpiService";
import { getToken } from "../services/authService";
import { decodeJwt } from "../utils/jwtDecode";

const Icons = {
    checkCircle: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-500">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
    ),
    xCircle: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-rose-500">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
        </svg>
    ),
    image: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-primary">
            <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a2.25 2.25 0 00-3.182 0l-1.44 1.439a2.25 2.25 0 01-3.182 0X8.06 10.06a2.25 2.25 0 00-3.182 0l-2.378 2.378zM14.75 6a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" clipRule="evenodd" />
        </svg>
    ),
    chevronLeft: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
        </svg>
    ),
    chevronRight: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
        </svg>
    )
};

const MentorPerformance = () => {
    const [mentees, setMentees] = useState<any[]>([]);
    const [activeMenteeId, setActiveMenteeId] = useState<string | null>(null);
    const [activeCycle, setActiveCycle] = useState<any>(null);

    const mentorId = useMemo(() => {
        const token = getToken();
        return token ? decodeJwt(token)?.employeeId : null;
    }, []);

    // Scopes state
    const [teamwork, setTeamwork] = useState<number | "">("");
    const [communication, setCommunication] = useState<number | "">("");
    const [technical, setTechnical] = useState<number | "">("");
    const [adaptability, setAdaptability] = useState<number | "">("");
    const [submitting, setSubmitting] = useState(false);
    const [assessmentFeedback, setAssessmentFeedback] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    // Evidence Review State
    const [goals, setGoals] = useState<any[]>([]);
    const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
    const [evidences, setEvidences] = useState<any[]>([]);
    const [activeEvidenceIndex, setActiveEvidenceIndex] = useState(0);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    const averageScore = useMemo(() => {
        const values = [teamwork, communication, technical, adaptability].map(v => typeof v === 'number' ? v : 0);
        return values.reduce((sum, val) => sum + val, 0) / 4;
    }, [teamwork, communication, technical, adaptability]);

    const isAssessmentComplete = teamwork !== "" && communication !== "" && technical !== "" && adaptability !== "";
    const allKpisApproved = useMemo(() => {
        return goals.length > 0 && goals.every(g => g.status === 'COMPLETED');
    }, [goals]);

    const loadMenteeDetails = async () => {
        if (!activeMenteeId) return;
        const goalsData = await kpiService.getGoalsByEmployee(activeMenteeId);
        setGoals(goalsData);
        if (goalsData.length > 0) {
            if (!activeGoalId || !goalsData.find(g => g.goalId === activeGoalId)) {
                setActiveGoalId(goalsData[0].goalId);
            }
        }

        const review = await kpiService.getActiveReview(activeMenteeId);
        if (review?.reviewId) {
            // Sync with the backend's active cycle
            if (review.cycle) {
                setActiveCycle(review.cycle);
            }

            const assessment = await kpiService.getMentorAssessment(review.reviewId);
            if (assessment) {
                setTeamwork(assessment.teamworkScore || "");
                setCommunication(assessment.communicationScore || "");
                setTechnical(assessment.technicalScore || "");
                setAdaptability(assessment.adaptabilityScore || "");
            } else {
                setTeamwork("");
                setCommunication("");
                setTechnical("");
                setAdaptability("");
            }
        }
    };

    useEffect(() => {
        const init = async () => {
            if (!mentorId) return;
            try {
                const [menteesData, cycles] = await Promise.all([
                    kpiService.getMentees(mentorId),
                    kpiService.getPerformanceCycles()
                ]);

                setMentees(menteesData);
                if (menteesData.length > 0) setActiveMenteeId(menteesData[0].employeeId || menteesData[0].id);

                // Find active cycle: Priority 1: ACTIVE coverage today, Priority 2: Latest ACTIVE, Priority 3: Latest ANY
                if (cycles && cycles.length > 0) {
                    const now = new Date();
                    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                    const bestCycle = cycles
                        .filter((c: any) => c.status === 'ACTIVE')
                        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                        .find((c: any) => nowStr >= c.startDate && nowStr <= c.endDate)
                        || cycles.find((c: any) => c.status === 'ACTIVE')
                        || cycles[0];

                    setActiveCycle(bestCycle);
                }
            } catch (err) {
                console.error("Init mentor error", err);
            }
        };
        init();
    }, [mentorId]);

    useEffect(() => {
        loadMenteeDetails();
    }, [activeMenteeId]);

    useEffect(() => {
        const loadEvidences = async () => {
            if (!activeGoalId) return;
            try {
                const evidenceData = await kpiService.getGoalEvidences(activeGoalId);
                setEvidences(evidenceData || []);
                setActiveEvidenceIndex(0);
            } catch (err) {
                setEvidences([]);
            }
        };
        loadEvidences();
    }, [activeGoalId]);

    const handleUpdateGoalStatus = async (status: 'COMPLETED' | 'ACKNOWLEDGED', reason?: string) => {
        if (!activeGoalId) return;
        setActionLoading(true);
        setActionMessage(null);
        try {
            await kpiService.updateEmployeeGoalStatus(activeGoalId, status, reason);
            setGoals(prev => prev.map(g => g.goalId === activeGoalId ? { ...g, status } : g));
        } catch (err: any) {
            setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update goal status' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmitAssessment = async () => {
        setAssessmentFeedback(null);
        if (!mentorId || !activeMenteeId || !activeCycle?.cycleId) {
            setAssessmentFeedback({ type: 'error', text: 'Missing mentor, employee, or cycle information.' });
            return;
        }
        if (!allKpisApproved) {
            setAssessmentFeedback({ type: 'error', text: 'You must approve all KPI evidence submissions before finalizing the assessment.' });
            return;
        }
        if (!isAssessmentComplete) {
            setAssessmentFeedback({ type: 'error', text: 'Please fill in scores for all 4 assessment criteria.' });
            return;
        }
        setSubmitting(true);
        try {
            await kpiService.submitMentorAssessment(mentorId, {
                employeeId: activeMenteeId,
                cycleId: activeCycle.cycleId,
                teamworkScore: teamwork as number,
                communicationScore: communication as number,
                technicalScore: technical as number,
                adaptabilityScore: adaptability as number
            });
            setAssessmentFeedback({ type: 'success', text: 'Assessment submitted successfully!' });
            // Reload to show current values from backend
            await loadMenteeDetails();
        } catch (err) {
            setAssessmentFeedback({ type: 'error', text: 'Failed to submit assessment' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-5 animate-fade-in font-sans pb-10">
            <header>
                <h1 className="text-3xl font-black text-text-primary-light">Mentor Review Panel</h1>
                <p className="text-text-secondary-light font-medium"></p>
            </header>

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
                {/* Main Review Area */}
                <div className="flex-1 space-y-6">
                    {/* Evidence Viewer */}
                    <div className="bg-white border border-border-light rounded-3xl shadow-xl overflow-hidden bento-card">
                        <div className="px-6 py-4 border-b border-border-light flex items-center justify-between bg-surface-2-light/30">
                            <div>
                                <h2 className="text-lg font-bold">Evidence Verification</h2>
                                <p className="text-xs text-text-muted-light font-bold uppercase tracking-wider">Goal: {goals.find(g => g.goalId === activeGoalId)?.title || "Select Goal"}</p>
                            </div>
                            <div className="flex gap-2">
                                {goals.map((g) => (
                                    <button
                                        key={g.goalId}
                                        onClick={() => setActiveGoalId(g.goalId)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeGoalId === g.goalId ? 'bg-primary text-white' : 'bg-surface-2-light hover:bg-surface-2-dark'}`}
                                    >
                                        Goal {goals.indexOf(g) + 1}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-8">
                            {evidences.length === 0 ? (
                                <div className="p-20 border-2 border-dashed border-border-light rounded-3xl flex flex-col items-center opacity-40">
                                    {Icons.image}
                                    <p className="text-sm font-bold mt-4 tracking-tight">No evidence files provided for this goal</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="relative aspect-video bg-surface-2-light rounded-3xl overflow-hidden border border-border-light group flex items-center justify-center">
                                        {evidences[activeEvidenceIndex].fileUrl.toLowerCase().endsWith('.pdf') ? (
                                            <iframe
                                                src={evidences[activeEvidenceIndex].fileUrl}
                                                className="w-full h-full border-0"
                                                title="Evidence PDF"
                                            />
                                        ) : (
                                            <img
                                                src={evidences[activeEvidenceIndex].fileUrl}
                                                className="w-full h-full object-contain"
                                                alt="Evidence"
                                            />
                                        )}

                                        {/* Goal Status Badge - Only show when Approved or Rejected */}
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            {(() => {
                                                const currentGoalStatus = goals.find(g => g.goalId === activeGoalId)?.status;
                                                if (currentGoalStatus === 'COMPLETED') {
                                                    return (
                                                        <span className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg bg-emerald-500 text-white">
                                                            APPROVED
                                                        </span>
                                                    );
                                                }
                                                if (currentGoalStatus === 'ACKNOWLEDGED') {
                                                    return (
                                                        <span className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg bg-rose-500 text-white">
                                                            REJECTED
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>

                                        {/* Navigation */}
                                        {evidences.length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => setActiveEvidenceIndex(prev => Math.max(0, prev - 1))}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    {Icons.chevronLeft}
                                                </button>
                                                <button
                                                    onClick={() => setActiveEvidenceIndex(prev => Math.min(evidences.length - 1, prev + 1))}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    {Icons.chevronRight}
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {evidences.map((e, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setActiveEvidenceIndex(idx)}
                                                    className={`w-16 h-16 rounded-xl border-2 cursor-pointer overflow-hidden transition-all ${activeEvidenceIndex === idx ? 'border-primary ring-4 ring-primary/20 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                                >
                                                    <img src={e.fileUrl} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            {goals.find(g => g.goalId === activeGoalId)?.status === 'SUBMITTED' && (
                                                <div className="flex gap-4 justify-end">
                                                    <button
                                                        onClick={() => handleUpdateGoalStatus('COMPLETED')}
                                                        disabled={actionLoading}
                                                        className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                                                    >
                                                        APPROVE GOAL
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateGoalStatus('ACKNOWLEDGED')}
                                                        disabled={actionLoading}
                                                        className="px-8 py-3 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 disabled:opacity-50"
                                                    >
                                                        REJECT GOAL
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Behavior Scoring */}
                    <div className="bg-white border border-border-light rounded-3xl shadow-xl overflow-hidden bento-card bg-gradient-to-br from-white to-primary/5">
                        <div className="p-8">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h2 className="text-2xl font-black">Behavioral Assessment</h2>
                                    <p className="text-text-secondary-light font-bold opacity-60"></p>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black text-primary leading-none">{averageScore.toFixed(1)}</div>
                                    <span className="text-[10px] uppercase font-black opacity-40"></span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <ScoreInput label="Teamwork" value={teamwork} onChange={(v: any) => { setTeamwork(v); setAssessmentFeedback(null); }} subtext="" />
                                <ScoreInput label="Communication" value={communication} onChange={(v: any) => { setCommunication(v); setAssessmentFeedback(null); }} subtext="" />
                                <ScoreInput label="Technical Growth" value={technical} onChange={(v: any) => { setTechnical(v); setAssessmentFeedback(null); }} subtext="" />
                                <ScoreInput label="Adaptability" value={adaptability} onChange={(v: any) => { setAdaptability(v); setAssessmentFeedback(null); }} subtext="" />
                            </div>

                            <button
                                onClick={handleSubmitAssessment}
                                disabled={submitting || !activeMenteeId}
                                className={`w-full mt-10 py-5 rounded-3xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl disabled:opacity-40 disabled:grayscale ${activeMenteeId ? 'bg-primary text-white shadow-primary/40 hover:scale-[1.01] active:scale-95' : 'bg-gray-200 text-gray-400 shadow-none'}`}
                            >
                                {submitting ? "Submitting..." : `Finalize Mentor Assessment`}
                            </button>
                            {assessmentFeedback && (
                                <div className={`mt-4 p-4 border rounded-2xl flex items-center gap-3 animate-fade-in ${assessmentFeedback.type === 'error' ? 'bg-rose-50 border-rose-100 animate-shake' : 'bg-emerald-50 border-emerald-100'}`}>
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${assessmentFeedback.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                    <p className={`text-[11px] font-bold uppercase tracking-wider leading-relaxed ${assessmentFeedback.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {assessmentFeedback.text}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mentee Selection Sidebar */}
                <div className="w-80 flex-shrink-0">
                    <div className="bg-white border border-border-light rounded-3xl shadow-xl overflow-hidden bento-card sticky top-6">
                        <div className="px-6 py-4 border-b border-border-light bg-surface-2-light/30">
                            <h2 className="text-xs font-black uppercase tracking-widest">My Mentees</h2>
                        </div>
                        <div className="p-3 space-y-2 max-h-[70vh] overflow-y-auto">
                            {mentees.map((m) => {
                                const id = m.id || m.employeeId;
                                return (
                                    <div
                                        key={id}
                                        onClick={() => setActiveMenteeId(id)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${activeMenteeId === id ? 'bg-primary text-white shadow-xl scale-[1.02]' : 'hover:bg-surface-2-light'}`}
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-surface-2-dark flex items-center justify-center font-black text-lg border-2 border-white/20">
                                            {m.fullName?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold truncate">{m.fullName}</div>
                                            <div className={`text-[10px] uppercase font-black opacity-60 ${activeMenteeId === id ? 'text-white' : 'text-text-muted-light'}`}>
                                                {m.positionTitle || "Employee"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ScoreInput = ({ label, value, onChange, subtext }: any) => (
    <div className="space-y-3">
        <label className="text-[11px] font-black uppercase tracking-widest text-text-primary-light/70 ml-1">
            {label}
        </label>
        <div className={`relative transition-all duration-300 ${value !== "" ? 'scale-[1.02]' : ''}`}>
            <input
                type="number"
                min="0"
                max="100"
                value={value}
                placeholder=""
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                        onChange("");
                    } else {
                        const num = parseInt(val);
                        if (!isNaN(num)) onChange(Math.min(100, Math.max(0, num)));
                    }
                }}
                className={`w-full px-6 py-4 bg-[#f1f5f9]/50 border rounded-2xl font-bold text-base outline-none transition-all placeholder:text-slate-300 placeholder:font-medium
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                    ${value !== ""
                        ? 'border-primary/50 text-primary bg-primary/5 ring-4 ring-primary/5'
                        : 'border-slate-100 text-slate-700 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5'}`}
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                <span className="text-[10px] font-bold text-slate-300 tracking-tighter">{subtext}</span>
                {value !== "" && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
            </div>
        </div>
    </div>
);

export default MentorPerformance;
