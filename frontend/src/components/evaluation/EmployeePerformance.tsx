import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { kpiService } from "../../services/kpiService";
import { getToken } from "../../services/authService";
import { decodeJwt } from "../../utils/jwtDecode";

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
    const [trainings, setTrainings] = useState<any[]>([]);
    const [selectedUpdateKpiId, setSelectedUpdateKpiId] = useState<string | null>(null);
    const [certUploadLoading, setCertUploadLoading] = useState<Record<string, boolean>>({});
    const [selectedCertFiles, setSelectedCertFiles] = useState<Record<string, File | null>>({});
    const [activeReview, setActiveReview] = useState<any>(null);
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [previewCertUrl, setPreviewCertUrl] = useState<string | null>(null);
    const [certBlobUrl, setCertBlobUrl] = useState<string | null>(null);
    const [certFetchLoading, setCertFetchLoading] = useState(false);
    const [certFetchError, setCertFetchError] = useState<string | null>(null);

    // Get real employee ID from session
    const employeeId = useMemo(() => {
        const token = getToken();
        return token ? decodeJwt(token)?.employeeId : null;
    }, []);

    const isExpired = (endDateString?: string) => {
        if (!endDateString) return false;
        const endDate = new Date(endDateString);
        endDate.setHours(23, 59, 59, 999);
        return new Date() > endDate;
    };

    useEffect(() => {
        if (!employeeId) {
            setLoading(false);
            return;
        }
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
                    category: g.kpiLibrary?.category || "N/A",
                    measurementType: g.kpiLibrary?.measurementType || 'NUMERIC',
                    cycleEndDate: g.cycle?.endDate,
                    submittedAt: g.submittedAt,
                    note: g.reviewerComment
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

                const empTrainings = await kpiService.getTrainingForEmployee(employeeId);
                setTrainings(empTrainings);

                // Fetch active review 
                const review = await kpiService.getActiveReview(employeeId);
                setActiveReview(review);
            } catch (error) {
                console.error("Failed to load goals or trainings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGoals();
    }, [employeeId]);

    // Handle fetching certificate blob with authentication
    useEffect(() => {
        if (!previewCertUrl) {
            setCertBlobUrl(null);
            setCertFetchError(null);
            return;
        }

        const fetchBlob = async () => {
            setCertFetchLoading(true);
            setCertFetchError(null);
            try {
                const token = getToken();
                const response = await fetch(previewCertUrl!, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to load file: ${response.status} ${response.statusText}`);
                }

                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                setCertBlobUrl(blobUrl);
            } catch (err: any) {
                console.error("Fetch certificate error:", err);
                setCertFetchError(err.message || 'Error loading file');
            } finally {
                setCertFetchLoading(false);
            }
        };

        fetchBlob();

        return () => {
            if (certBlobUrl) {
                URL.revokeObjectURL(certBlobUrl);
            }
        };
    }, [previewCertUrl]);

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
                category: g.kpiLibrary?.category || "N/A",
                measurementType: g.kpiLibrary?.measurementType || 'NUMERIC',
                cycleEndDate: g.cycle?.endDate,
                submittedAt: g.submittedAt,
                note: g.reviewerComment
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
        } catch (e: any) {
            console.error("Failed to acknowledge goal", e);
            const errorMsg = e.response?.data?.message || "Failed to acknowledge goal.";
            setActionMessage({ type: 'error', text: errorMsg });
        }
    };

    const handleFileChange = (goalId: string, file: File | null) => {
        setSelectedFiles(prev => ({ ...prev, [goalId]: file }));
    };

    const handleCertFileChange = (participantId: string, file: File | null) => {
        setSelectedCertFiles(prev => ({ ...prev, [participantId]: file }));
    };

    const handleCertUpload = async (participantId: string) => {
        const file = selectedCertFiles[participantId];
        if (!file) {
            setActionMessage({ type: 'error', text: 'Please select a certificate file to upload.' });
            return;
        }

        setCertUploadLoading(prev => ({ ...prev, [participantId]: true }));
        try {
            const uploadedUrl = await kpiService.uploadFile(file);
            await kpiService.submitTrainingCertificate(participantId, uploadedUrl);
            setActionMessage({ type: 'success', text: 'Certificate uploaded successfully!' });
            // Refresh trainings
            if (employeeId) {
                const empTrainings = await kpiService.getTrainingForEmployee(employeeId);
                setTrainings(empTrainings);
            }
            setSelectedCertFiles(prev => ({ ...prev, [participantId]: null }));
        } catch (error: any) {
            console.error("Failed to upload certificate", error);
            setActionMessage({ type: 'error', text: 'Failed to upload certificate' });
        } finally {
            setCertUploadLoading(prev => ({ ...prev, [participantId]: false }));
        }
    };

    const handleProgressUpdate = async (goalId: string) => {
        setActionMessage(null);
        const res = results[goalId];
        const comm = goalComments[goalId];
        const file = selectedFiles[goalId];

        // Frontend validation
        if (res === undefined || res === null || res.trim() === '') {
            setActionMessage({ type: 'error', text: 'Please enter an actual value.' });
            return;
        }

        if (!file) {
            setActionMessage({ type: 'error', text: 'You must upload at least one evidence file to confirm your work results.' });
            return;
        }

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
            setSelectedUpdateKpiId(null);
            setActionMessage({ type: 'success', text: 'Progress record updated successfully!' });
        } catch (e: any) {
            console.error("Failed to update progress", e);
            const errorMsg = e.response?.data?.message || e.response?.data || "Failed to update progress";
            setActionMessage({ type: 'error', text: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg });
        } finally {
            setSubmitLoading(prev => ({ ...prev, [goalId]: false }));
        }
    };

    const handleFinalSubmit = async () => {
        if (!activeReview || activeReview.status !== 'DRAFT') return;
        if (!window.confirm("Are you sure you want to submit your final performance appraisal? You won't be able to update your KPI progress anymore.")) return;

        try {
            await kpiService.finalizeReview(activeReview.reviewId);
            setActionMessage({ type: 'success', text: 'Final review submitted successfully!' });
            // Refresh 
            const review = await kpiService.getActiveReview(employeeId!);
            setActiveReview(review);
        } catch (e) {
            setActionMessage({ type: 'error', text: 'Failed to submit final review.' });
        }
    };

    if (loading) return <div className="p-20 text-center font-black opacity-20 uppercase tracking-[0.2em] animate-pulse">Loading My Performance...</div>;

    return (
        <div className="flex flex-col h-full space-y-8 animate-fade-in font-sans pb-10">
            {/* Header & Breadcrumb */}
            <div className="space-y-1">
                <nav className="flex text-xs font-bold text-text-muted-light uppercase tracking-widest gap-2">
                    <span className="hover:text-primary transition-colors cursor-pointer"></span>
                    <span className="opacity-30"></span>
                    <span className="text-text-primary-light"></span>
                </nav>
                <div className="flex items-center justify-between pt-2">
                    <div>
                        <h1 className="text-4xl font-black text-text-primary-light dark:text-text-primary-dark tracking-tight uppercase">
                            My Learning & Goals
                        </h1>
                        <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark max-w-2xl leading-relaxed">
                        </p>
                    </div>
                    <button
                        onClick={() => activeReview?.status === 'DRAFT' && handleFinalSubmit()}
                        disabled={!activeReview || activeReview.status !== 'DRAFT'}
                        className={`flex items-center gap-2 px-6 py-3 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-all ${activeReview?.status === 'DRAFT'
                            ? 'bg-primary shadow-primary/20 hover:scale-[1.02] active:scale-95'
                            : 'bg-emerald-500 shadow-emerald-500/10 opacity-80 cursor-default'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        {activeReview?.status === 'DRAFT' ? 'Submit Final Review' : 'Final Review Submitted'}
                    </button>
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

            {/* Performance Results Summary (Visible when graded and submitted) */}
            {(activeReview?.status !== 'DRAFT' && activeReview?.kpiScore !== null && activeReview?.attitudeScore !== null) && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up">
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-light shadow-sm">
                        <div className="text-[10px] font-black text-text-muted-light uppercase tracking-widest mb-1">Overall Score</div>
                        <div className="text-3xl font-black text-primary">{activeReview.overallScore?.toFixed(1) || 'N/A'}</div>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-light shadow-sm">
                        <div className="text-[10px] font-black text-text-muted-light uppercase tracking-widest mb-1">KPI Score</div>
                        <div className="text-2xl font-black text-text-primary-light">{activeReview.kpiScore?.toFixed(1) || 'N/A'}</div>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-light shadow-sm">
                        <div className="text-[10px] font-black text-text-muted-light uppercase tracking-widest mb-1">Attitude Score</div>
                        <div className="text-2xl font-black text-text-primary-light">{activeReview.attitudeScore?.toFixed(1) || 'N/A'}</div>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-light shadow-sm">
                        <div className="text-[10px] font-black text-text-muted-light uppercase tracking-widest mb-1">Final Rating</div>
                        <div className="text-2xl font-black text-emerald-500 italic uppercase">{activeReview.rating || 'PENDING'}</div>
                    </div>
                </div>
            )}

            {/* Assigned Trainings Section */}
            {trainings.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-text-primary-light uppercase tracking-tight flex items-center gap-3">
                            Assigned Trainings
                            <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-full">{trainings.length} Courses</span>
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-xl overflow-hidden bento-card">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-2-light/30 dark:bg-surface-2-dark/30 border-b border-border-light dark:border-border-dark">
                                    <th className="px-6 py-5 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em]">Course Name</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em]">Platform</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em] text-center">Deadline</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em] text-center">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em] text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {trainings.map((t: any) => (
                                    <tr key={t.participantId} className="group hover:bg-amber-500/[0.02] transition-colors">
                                        <td className="px-6 py-6 border-l-4 border-transparent group-hover:border-amber-500 transition-colors">
                                            <div className="font-bold text-[15px] text-text-primary-light group-hover:text-amber-600 transition-colors">{t.course?.courseName || 'N/A'}</div>
                                            <div className="text-[11px] font-bold text-text-muted-light mt-1 max-w-sm truncate" title={t.reason}>Reason: {t.reason}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-sm font-bold text-text-secondary-light bg-surface-2-light px-3 py-1.5 rounded-lg inline-block">
                                                {t.course?.platform || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className="font-bold text-sm text-text-secondary-light">{t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No deadline'}</span>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${t.status === 'CONFIRMED'
                                                ? 'bg-emerald-100 text-emerald-600 border-emerald-200'
                                                : t.status === 'COMPLETED'
                                                    ? 'bg-indigo-100 text-indigo-600 border-indigo-200'
                                                    : t.status === 'REJECTED'
                                                        ? 'bg-rose-100 text-rose-600 border-rose-200'
                                                        : t.status === 'FAILED'
                                                            ? 'bg-rose-100 text-rose-600 border-rose-200'
                                                            : 'bg-amber-100 text-amber-600 border-amber-200'
                                                }`}>
                                                {t.status === 'COMPLETED' ? 'AWAITING HR' : t.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right space-x-2">
                                            {t.status === 'CONFIRMED' ? (
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-widest">
                                                        Confirmed
                                                    </span>
                                                    {t.certificateUrl && (
                                                        <button
                                                            onClick={() => setPreviewCertUrl(t.certificateUrl.startsWith('http') ? t.certificateUrl : `http://localhost:8080${t.certificateUrl}`)}
                                                            className="text-[10px] font-bold text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
                                                        >
                                                            View Certificate
                                                        </button>
                                                    )}
                                                </div>
                                            ) : t.status === 'COMPLETED' ? (
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 uppercase tracking-widest">
                                                        Awaiting HR
                                                    </span>
                                                    <p className="text-[9px] text-text-muted-light font-bold italic mt-1">Pending verification</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end gap-3">
                                                    <a
                                                        href={t.course?.courseUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-block px-5 py-2.5 bg-text-primary-light text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg text-center w-full"
                                                    >
                                                        Start Learning
                                                    </a>

                                                    <div className="flex items-center gap-2 w-full">
                                                        <input
                                                            type="file"
                                                            id={`cert-upload-${t.participantId}`}
                                                            className="hidden"
                                                            onChange={(e) => handleCertFileChange(t.participantId, e.target.files?.[0] || null)}
                                                            accept="image/*,.pdf"
                                                        />
                                                        <button
                                                            onClick={() => document.getElementById(`cert-upload-${t.participantId}`)?.click()}
                                                            className="flex-1 px-3 py-2 text-[10px] font-bold text-text-secondary-light bg-surface-2-light border border-border-light rounded-lg hover:border-primary/30 transition-colors whitespace-nowrap truncate text-center"
                                                        >
                                                            {selectedCertFiles[t.participantId] ? selectedCertFiles[t.participantId]?.name : (t.status === 'REJECTED' ? 'Re-upload Cert' : 'Choose Cert')}
                                                        </button>
                                                        <button
                                                            onClick={() => handleCertUpload(t.participantId)}
                                                            disabled={!selectedCertFiles[t.participantId] || certUploadLoading[t.participantId]}
                                                            className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:scale-100 transition-all min-w-[80px]"
                                                        >
                                                            {certUploadLoading[t.participantId] ? '...' : (t.status === 'REJECTED' ? 'Resubmit' : 'Upload')}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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
                                <th className="px-6 py-5 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em] text-center">Target</th>
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
                                        {kpi.status === 'ACKNOWLEDGED' && kpi.submittedAt && kpi.note && (
                                            <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-[11px] text-rose-600 font-medium animate-fade-in">
                                                <span className="font-black uppercase tracking-widest mr-2 opacity-60">Note:</span>
                                                {kpi.note}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="text-sm text-text-secondary-light font-medium max-w-sm">{kpi.measurement}</div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <span className="font-black text-sm">{kpi.weight}%</span>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className="bg-primary/5 px-3 py-1.5 rounded-lg inline-block">
                                            <span className="font-black text-sm text-primary italic">{kpi.target}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isExpired(kpi.cycleEndDate)
                                            ? 'bg-gray-100 text-gray-400 border border-gray-200'
                                            : kpi.status === 'ASSIGNED'
                                                ? 'bg-blue-100 text-blue-600 border border-blue-200'
                                                : kpi.status === 'ACKNOWLEDGED'
                                                    ? (kpi.submittedAt ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-amber-100 text-amber-600 border border-amber-200')
                                                    : kpi.status === 'SUBMITTED'
                                                        ? 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                                                        : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                            }`}>
                                            {isExpired(kpi.cycleEndDate)
                                                ? 'EXPIRED'
                                                : kpi.status === 'SUBMITTED'
                                                    ? 'PENDING MENTOR'
                                                    : kpi.status === 'ACKNOWLEDGED'
                                                        ? (kpi.submittedAt ? 'REJECTED' : 'ACKNOWLEDGED')
                                                        : kpi.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        {isExpired(kpi.cycleEndDate) ? (
                                            <span className="text-text-muted-light text-[10px] font-black uppercase tracking-widest italic opacity-60">
                                                Cycle Ended
                                            </span>
                                        ) : kpi.status === 'ASSIGNED' ? (
                                            <button
                                                onClick={() => handleAcknowledge(kpi.id)}
                                                className="px-5 py-2.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                                            >
                                                Acknowledge
                                            </button>
                                        ) : kpi.status === 'COMPLETED' ? (
                                            <button
                                                onClick={() => setShowEvaluationModal(true)}
                                                className="text-emerald-500 hover:text-emerald-600 text-xs font-black uppercase tracking-widest flex items-center gap-1 justify-end ml-auto"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                                View Evaluation
                                            </button>
                                        ) : (activeReview?.status !== 'DRAFT' && activeReview?.status !== undefined) ? (
                                            <span className="text-text-muted-light text-[10px] font-black uppercase tracking-widest italic">
                                                Review Closed
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setSelectedUpdateKpiId(kpi.id)}
                                                className="text-primary hover:underline text-xs font-black uppercase tracking-widest"
                                            >
                                                Submit Evidence
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Update Progress Modal */}
            {selectedUpdateKpiId && createPortal(
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-surface-dark border border-border-light rounded-3xl p-6 md:p-8 shadow-2xl w-full max-w-4xl max-h-[95vh] relative animate-fade-in group hover:border-primary/30 transition-all bento-card">

                        <button
                            onClick={() => setSelectedUpdateKpiId(null)}
                            className="absolute top-5 right-5 p-2 rounded-full bg-surface-2-light dark:bg-surface-2-dark text-text-muted-light hover:text-red-500 transition-all z-10"
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>

                        <div className="space-y-1 text-center mb-6">
                            <h2 className="text-xl font-black text-text-primary-light uppercase tracking-tight">Update My Progress</h2>
                            <p className="text-[10px] text-text-muted-light font-bold uppercase tracking-widest leading-none">Submit Current Results & Evidence</p>
                        </div>

                        {actionMessage && (
                            <div className={`mb-6 flex items-center gap-3 text-xs font-bold rounded-xl px-5 py-3 animate-fade-in ${actionMessage.type === 'error' ? 'text-red-600 bg-red-50 border border-red-100 shadow-sm shadow-red-500/10' : 'text-emerald-600 bg-emerald-50 border border-emerald-100 shadow-sm shadow-emerald-500/10'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${actionMessage.type === 'error' ? 'bg-red-100' : 'bg-emerald-100'}`}>
                                    {actionMessage.type === 'error'
                                        ? <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                                        : <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                                    }
                                </div>
                                <div className="flex-1">{actionMessage.text}</div>
                                <button onClick={() => setActionMessage(null)} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
                                    <svg className="w-4 h-4 opacity-50" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        )}

                        {(() => {
                            const kpi = kpis.find(k => k.id === selectedUpdateKpiId);
                            if (!kpi) return null;
                            return (
                                <div className="flex flex-col lg:flex-row gap-8 relative overflow-hidden">
                                    {/* Watermark/Index */}
                                    <div className="absolute -top-10 -right-10 text-[100px] font-black text-primary opacity-[0.03] select-none pointer-events-none">
                                        {kpi.category.charAt(0)}
                                    </div>

                                    {/* Left: Input Fields */}
                                    <div className="flex-[1.4] space-y-6 relative z-10">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-8 bg-primary rounded-full"></div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">{kpi.category}</span>
                                            </div>
                                            <h3 className="text-xl font-black text-text-primary-light leading-tight">{kpi.name}</h3>
                                            <p className="text-xs text-text-secondary-light font-medium italic opacity-70">"{kpi.measurement}"</p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-text-muted-light tracking-widest">Target Objective</label>
                                                <div className="px-5 py-3.5 bg-primary/5 border border-primary/10 rounded-xl text-lg font-black text-primary italic">
                                                    {kpi.measurementType === 'BOOLEAN' ? (kpi.target == '1' ? 'Yes' : (kpi.target == '0' ? 'No' : kpi.target)) : kpi.target}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-text-muted-light tracking-widest">Current Actual Result</label>
                                                {kpi.measurementType === 'BOOLEAN' ? (
                                                    <select
                                                        value={results[kpi.id] || '1'}
                                                        onChange={(e) => setResults(prev => ({ ...prev, [kpi.id]: e.target.value }))}
                                                        disabled={kpi.status === 'COMPLETED'}
                                                        className="w-full px-5 py-3.5 bg-surface-2-light/50 border border-border-light rounded-xl text-lg font-black transition-all outline-none"
                                                    >
                                                        <option value="1">Yes</option>
                                                        <option value="0">No</option>
                                                    </select>
                                                ) : (
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={results[kpi.id] || ''}
                                                            onChange={(e) => {
                                                                let val = e.target.value;
                                                                if (kpi.measurementType === 'PERCENTAGE' && val !== '') {
                                                                    if (Number(val) > 100) val = '100';
                                                                    if (Number(val) < 0) val = '0';
                                                                }
                                                                setResults(prev => ({ ...prev, [kpi.id]: val }));
                                                            }}
                                                            disabled={kpi.status === 'COMPLETED'}
                                                            className={`w-full px-5 py-3.5 bg-surface-2-light/50 border border-border-light focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl text-lg font-black transition-all outline-none ${kpi.measurementType === 'PERCENTAGE' ? 'pr-10' : ''}`}
                                                            placeholder="0"
                                                        />
                                                        {kpi.measurementType === 'PERCENTAGE' && (
                                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted-light font-bold text-lg pointer-events-none">%</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <label className="text-[9px] font-black uppercase text-text-muted-light tracking-widest">Progress Visualization</label>
                                                <span className="text-xl font-black text-emerald-500">{getProgressPercentage(kpi.id, results[kpi.id] || '0')}%</span>
                                            </div>
                                            <div className="h-3 w-full bg-surface-2-light rounded-full overflow-hidden border border-border-light shadow-inner p-0.5">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)] relative"
                                                    style={{ width: `${getProgressPercentage(kpi.id, results[kpi.id] || '0')}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase text-text-muted-light tracking-widest">Self Assessment & Context</label>
                                            <textarea
                                                value={goalComments[kpi.id] || ''}
                                                onChange={(e) => setGoalComments(prev => ({ ...prev, [kpi.id]: e.target.value }))}
                                                disabled={kpi.status === 'COMPLETED'}
                                                className="w-full px-5 py-3.5 bg-surface-2-light/50 border border-border-light focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl text-xs font-medium transition-all outline-none min-h-[90px]"
                                                placeholder="Briefly explain your progress..."
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Evidence & Finalize */}
                                    <div className="flex-1 flex flex-col bg-surface-2-light/30 rounded-2xl p-6 border border-border-light/50 relative z-10">
                                        <label className="text-[9px] font-black uppercase text-text-muted-light tracking-widest mb-4 block">Evidence Documentation</label>

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
                                                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center group transition-all cursor-pointer mb-6 ${selectedFiles[kpi.id]
                                                    ? 'border-emerald-500 bg-emerald-50/30'
                                                    : 'border-border-light bg-white hover:border-primary'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${selectedFiles[kpi.id] ? 'bg-emerald-100' : 'bg-primary/10'
                                                    }`}>
                                                    {selectedFiles[kpi.id] ? Icons.checkCircle : Icons.upload}
                                                </div>
                                                <h4 className="text-[11px] font-black text-text-primary-light truncate w-full">
                                                    {selectedFiles[kpi.id] ? selectedFiles[kpi.id]?.name : 'Upload Proof'}
                                                </h4>
                                                <p className="text-[9px] font-bold text-text-muted-light uppercase mt-1">
                                                    {selectedFiles[kpi.id] ? 'File selected' : 'PDF/Images Max 10MB'}
                                                </p>
                                            </div>

                                            <div className="mt-auto space-y-3">
                                                <div className="flex items-center justify-between text-[9px] font-black uppercase text-text-muted-light mb-2">
                                                    <span>Status</span>
                                                    <span className={`px-2 py-0.5 rounded-full ${kpi.status === 'SUBMITTED' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                                        {kpi.status}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleProgressUpdate(kpi.id)}
                                                    disabled={kpi.status === 'COMPLETED' || submitLoading[kpi.id] || isExpired(kpi.cycleEndDate)}
                                                    className="w-full py-3.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-xl shadow-lg shadow-emerald-500/10 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 flex items-center justify-center gap-2"
                                                >
                                                    {submitLoading[kpi.id] ? (
                                                        <>
                                                            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                            Processing
                                                        </>
                                                    ) : isExpired(kpi.cycleEndDate) ? 'Capturing Ended' : 'Submit Progress'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>, document.body
            )}
            {/* View Evaluation Modal */}
            {showEvaluationModal && activeReview && createPortal(
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark border border-border-light rounded-[2.5rem] p-10 shadow-2xl w-full max-w-2xl relative animate-scale-in bento-card">
                        <button
                            onClick={() => setShowEvaluationModal(false)}
                            className="absolute top-6 right-6 p-2 rounded-full bg-surface-2-light dark:bg-surface-2-dark text-text-muted-light hover:text-red-500 transition-all"
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>

                        <div className="text-center mb-10 space-y-2">
                            <h2 className="text-3xl font-black text-text-primary-light uppercase tracking-tight">Performance Appraisal</h2>
                            <p className="text-xs text-text-muted-light font-bold uppercase tracking-[0.2em]">Final Review Results</p>
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-surface-2-light rounded-2xl border border-border-light flex flex-col items-center">
                                    <span className="text-[10px] font-black text-text-muted-light uppercase tracking-widest mb-2">KPI Score</span>
                                    <span className="text-4xl font-black text-text-primary-light">{activeReview.kpiScore?.toFixed(1) || '0.0'}</span>
                                </div>
                                <div className="p-6 bg-surface-2-light rounded-2xl border border-border-light flex flex-col items-center">
                                    <span className="text-[10px] font-black text-text-muted-light uppercase tracking-widest mb-2">Attitude Score</span>
                                    <span className="text-4xl font-black text-text-primary-light">{activeReview.attitudeScore?.toFixed(1) || '0.0'}</span>
                                </div>
                            </div>

                            <div className="relative p-10 bg-primary/5 rounded-[2rem] border-2 border-primary/10 overflow-hidden flex flex-col items-center">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <svg className="w-32 h-32 text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                                </div>
                                <span className="text-[11px] font-black text-primary/60 uppercase tracking-[0.3em] mb-4">Overall Performance</span>
                                <div className="text-7xl font-black text-primary italic leading-none">{activeReview.overallScore?.toFixed(1) || '0.0'}</div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-200/50">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                    <span className="text-xs font-black text-amber-800 uppercase tracking-widest">Note from Management</span>
                                </div>
                                <p className="text-sm text-amber-900/70 font-medium italic whitespace-pre-wrap">
                                    {activeReview.rating}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>, document.body
            )}

            <CertPreviewModal 
                url={previewCertUrl}
                blobUrl={certBlobUrl}
                loading={certFetchLoading}
                error={certFetchError}
                onClose={() => setPreviewCertUrl(null)}
            />
        </div>
    );
};

const CertPreviewModal = ({ url, blobUrl, loading, error, onClose }: any) => {
    if (!url) return null;
    return createPortal(
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-8 py-5 border-b border-border-light">
                    <h3 className="font-black text-sm text-text-primary-light uppercase tracking-widest">Certificate Preview</h3>
                    <div className="flex items-center gap-4">
                        <a href={blobUrl || url} download="training-certificate" className={`px-5 py-2.5 text-[10px] font-black uppercase text-primary bg-primary/10 rounded-xl ${!blobUrl ? 'opacity-50 pointer-events-none' : ''}`}>↓ Download</a>
                        <button onClick={onClose} className="p-2.5 rounded-xl text-text-muted-light hover:text-red-500">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-6 bg-surface-2-light flex items-center justify-center min-h-[500px]">
                    {loading ? (
                        <div className="animate-spin w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full"></div>
                    ) : error ? (
                        <div className="text-rose-500 text-center">{error}</div>
                    ) : blobUrl ? (
                        url.toLowerCase().includes('.pdf') ? (
                            <iframe src={blobUrl} className="w-full h-[650px] border-none" title="Cert" />
                        ) : (
                            <img src={blobUrl} className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-xl" alt="Cert" />
                        )
                    ) : null}
                </div>
            </div>
        </div>, document.body
    );
};

export default EmployeePerformance;
