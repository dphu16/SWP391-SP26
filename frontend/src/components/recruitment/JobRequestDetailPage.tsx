import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { jobRequestService } from "../../services/jobRequestService";
import type { JobRequest } from "../ui/types";
import { LoadingSpinner, ErrorMessage } from "./StatusDisplay";

const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-text-muted-light mb-1";
const valueCls = "text-sm font-semibold text-text-primary-light";

const JobRequestDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [request, setRequest] = useState<JobRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hrComment, setHrComment] = useState("");
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await jobRequestService.getById(id);
                setRequest(res.data);
                setHrComment(res.data.comment || "");
            } catch (err) {
                setError("Failed to load job request details.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleStatusUpdate = async (newStatus: "APPROVED" | "REJECTED") => {
        if (!request || !id) return;
        try {
            setUpdating(true);
            await jobRequestService.updateStatus(id, newStatus, hrComment);
            setRequest({ ...request, status: newStatus, comment: hrComment });
            // Add any success toast here if needed
            alert(`Job request marked as ${newStatus}`);
        } catch (err) {
            alert("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error || !request) return <ErrorMessage message={error || "Job request not found."} />;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-light">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary-light mb-4">
                        <Link to="/dashboard" className="hover:text-primary transition-colors">Home</Link>
                        <span className="mx-1">&gt;</span>
                        <Link to="/recruitment/job-requests" className="hover:text-primary transition-colors">Job Requests</Link>
                        <span className="mx-1">&gt;</span>
                        <span className="text-text-primary-light">{request.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black font-heading text-text-primary-light tracking-tight">
                            {request.title}
                        </h1>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${request.status === "SUBMITTED" ? "bg-amber-100 text-amber-700" :
                            request.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                                request.status === "REJECTED" ? "bg-rose-100 text-rose-700" :
                                    "bg-gray-100 text-gray-700"
                            }`}>
                            {request.status}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {request.status === "SUBMITTED" && (
                        <button
                            onClick={() => navigate(`/recruitment/job-requests/${request.id}/edit`)}
                            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 cursor-pointer"
                        >
                            Edit Request
                        </button>
                    )}
                    {request.status === "APPROVED" && (
                        <button
                            onClick={() => navigate(`/recruitment/jobs/new`, {
                                state: {
                                    requestId: request.id,
                                    title: request.title,
                                    quantity: request.quantity,
                                    reportTo: request.reportTo
                                }
                            })}
                            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                        >
                            Create Job
                        </button>
                    )}
                </div>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Information */}
                <div className="md:col-span-2 space-y-8">
                    <section className="bg-white rounded-3xl p-8 border border-border-light shadow-sm">
                        <h2 className="text-sm font-black uppercase tracking-widest text-text-primary-light mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Request Details
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-4">
                            <div>
                                <label className={labelCls}>Department</label>
                                <div className={valueCls}>{request.deptName}</div>
                            </div>
                            <div>
                                <label className={labelCls}>Employment Type</label>
                                <div className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-xs font-bold text-text-secondary-light uppercase tracking-wide">
                                    {request.type}
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Quantity</label>
                                <div className="text-lg font-black text-primary">{request.quantity} Position(s)</div>
                            </div>
                            <div>
                                <label className={labelCls}>Work Location</label>
                                <div className={valueCls}>{request.location}</div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl p-8 border border-border-light shadow-sm">
                        <h2 className="text-sm font-black uppercase tracking-widest text-text-primary-light mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Reason for Hiring
                        </h2>
                        <div className="text-sm leading-relaxed text-text-secondary-light bg-white p-5 rounded-2xl italic border-l-4 border-gray-200">
                            {request.reason}
                        </div>
                    </section>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <section className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 border border-indigo-100/50 shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/40 rounded-full blur-2xl pointer-events-none" />
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-indigo-900 mb-3 relative z-10">
                            Report To HR
                        </h2>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 shadow-sm">
                                {request.reviewer ? request.reviewer.charAt(0).toUpperCase() : "H"}
                            </div>
                            <span className="font-semibold text-indigo-900 text-sm">
                                {request.reviewer || "Not Assigned"}
                            </span>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl p-6 border border-border-light shadow-sm flex flex-col gap-4">
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-text-primary-light">
                            HR Feedback
                        </h2>
                        <div className="space-y-4">
                            <div>
                                {request.status === "SUBMITTED" ? (
                                    <textarea
                                        rows={3}
                                        value={hrComment}
                                        onChange={(e) => setHrComment(e.target.value)}
                                        placeholder="Add internal notes or approval terms before deciding..."
                                        className="w-full px-4 py-2 text-sm rounded-xl border border-border-light bg-white text-text-primary-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                                    />
                                ) : (
                                    <div className="text-xs text-text-secondary-light leading-relaxed p-3 bg-gray-50 rounded-xl border border-gray-100 italic">
                                        {request.comment || "No comments added."}
                                    </div>
                                )}
                            </div>

                            {request.status === "SUBMITTED" && (
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => handleStatusUpdate("REJECTED")}
                                        disabled={updating}
                                        className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate("APPROVED")}
                                        disabled={updating}
                                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                                    >
                                        Approve
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default JobRequestDetailPage;
