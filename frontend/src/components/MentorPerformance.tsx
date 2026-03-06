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
    const [teamwork, setTeamwork] = useState(80);
    const [communication, setCommunication] = useState(80);
    const [technical, setTechnical] = useState(80);
    const [adaptability, setAdaptability] = useState(80);
    const [submitting, setSubmitting] = useState(false);

    // Evidence Review State
    const [goals, setGoals] = useState<any[]>([]);
    const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
    const [evidences, setEvidences] = useState<any[]>([]);
    const [activeEvidenceIndex, setActiveEvidenceIndex] = useState(0);

    const activeMentee = useMemo(() => mentees.find(m => m.id === activeMenteeId || m.employeeId === activeMenteeId), [mentees, activeMenteeId]);
    console.log("activeMentee", activeMentee);
    const averageScore = useMemo(() => (teamwork + communication + technical + adaptability) / 4, [teamwork, communication, technical, adaptability]);

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

                const active = cycles.find(c => c.status === 'ACTIVE');
                setActiveCycle(active || cycles[0]);
            } catch (err) {
                console.error("Init mentor error", err);
            }
        };
        init();
    }, [mentorId]);

    useEffect(() => {
        const loadMenteeDetails = async () => {
            if (!activeMenteeId) return;
            const goalsData = await kpiService.getGoalsByEmployee(activeMenteeId);
            setGoals(goalsData);
            if (goalsData.length > 0) setActiveGoalId(goalsData[0].goalId);

            // Check if there's already an assessment
            const review = await kpiService.getActiveReview(activeMenteeId);
            if (review?.reviewId) {
                await kpiService.getMentorAttitudeScore(activeMenteeId);
            }
        };
        loadMenteeDetails();
    }, [activeMenteeId]);

    useEffect(() => {
        const loadEvidences = async () => {
            if (!activeGoalId) return;
            try {
                const evidenceData = await kpiService.getGoalEvidences(activeGoalId);
                setEvidences(evidenceData);
                setActiveEvidenceIndex(0);
            } catch (err) {
                setEvidences([]);
            }
        };
        loadEvidences();
    }, [activeGoalId]);

    const handleUpdateEvidenceStatus = async (evidenceId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await kpiService.updateEvidenceStatus(evidenceId, status);
            setEvidences(prev => prev.map(e => e.evidenceId === evidenceId ? { ...e, status } : e));
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const handleSubmitAssessment = async () => {
        if (!activeMenteeId || !activeCycle || !mentorId) return;
        setSubmitting(true);
        try {
            await kpiService.submitMentorAssessment(mentorId, {
                employeeId: activeMenteeId,
                cycleId: activeCycle.cycleId,
                teamworkScore: teamwork,
                communicationScore: communication,
                technicalScore: technical,
                adaptabilityScore: adaptability
            });
            alert("Assessment submitted successfully!");
        } catch (err) {
            alert("Failed to submit assessment");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-5 animate-fade-in font-sans pb-10">
            <header>
                <h1 className="text-3xl font-black text-text-primary-light">Mentor Review Panel</h1>
                <p className="text-text-secondary-light font-medium">Verify evidence and evaluate behavioral performance</p>
            </header>

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
                                    <div className="relative aspect-video bg-surface-2-light rounded-3xl overflow-hidden border border-border-light group">
                                        <img
                                            src={evidences[activeEvidenceIndex].fileUrl}
                                            className="w-full h-full object-contain"
                                            alt="Evidence"
                                        />

                                        {/* Status Badge */}
                                        <div className="absolute top-4 left-4">
                                            <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${evidences[activeEvidenceIndex].status === 'APPROVED' ? 'bg-emerald-500 text-white' :
                                                evidences[activeEvidenceIndex].status === 'REJECTED' ? 'bg-rose-500 text-white' :
                                                    'bg-amber-500 text-white'
                                                }`}>
                                                {evidences[activeEvidenceIndex].status}
                                            </span>
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
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleUpdateEvidenceStatus(evidences[activeEvidenceIndex].evidenceId, 'REJECTED')}
                                                className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-rose-200 hover:bg-rose-100 transition-all flex items-center gap-2"
                                            >
                                                {Icons.xCircle} Reject File
                                            </button>
                                            <button
                                                onClick={() => handleUpdateEvidenceStatus(evidences[activeEvidenceIndex].evidenceId, 'APPROVED')}
                                                className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-2"
                                            >
                                                {Icons.checkCircle} Approve File
                                            </button>
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
                                    <p className="text-text-secondary-light font-bold opacity-60">Evaluate based on monthly interaction & collaboration</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black text-primary leading-none">{averageScore.toFixed(1)}</div>
                                    <span className="text-[10px] uppercase font-black opacity-40">Average Rating</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <ScoreSlider label="Teamwork" value={teamwork} onChange={setTeamwork} subtext="Collaborates effectively with others" />
                                <ScoreSlider label="Communication" value={communication} onChange={setCommunication} subtext="Clear and professional interaction" />
                                <ScoreSlider label="Technical Growth" value={technical} onChange={setTechnical} subtext="Improvement in domain expertise" />
                                <ScoreSlider label="Adaptability" value={adaptability} onChange={setAdaptability} subtext="Handling changes and pressure" />
                            </div>

                            <button
                                onClick={handleSubmitAssessment}
                                disabled={submitting || !activeMenteeId}
                                className="w-full mt-10 py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-30"
                            >
                                {submitting ? "Submitting..." : "Finalize Mentor Assessment (30%)"}
                            </button>
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
                                                {m.position?.name || "Employee"}
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

const ScoreSlider = ({ label, value, onChange, subtext }: any) => (
    <div className="space-y-4">
        <div className="flex justify-between items-baseline">
            <div className="leading-tight">
                <label className="text-xs font-black uppercase tracking-widest block">{label}</label>
                <span className="text-[10px] font-bold opacity-40">{subtext}</span>
            </div>
            <span className="text-lg font-black text-primary">{value}</span>
        </div>
        <input
            type="range"
            min="0" max="100"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-surface-2-light rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[8px] font-black opacity-30 uppercase tracking-tighter">
            <span>Critical</span>
            <span>Needs Work</span>
            <span>Expected</span>
            <span>Outstanding</span>
        </div>
    </div>
);

export default MentorPerformance;
