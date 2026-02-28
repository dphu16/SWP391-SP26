import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { jobService } from "../../services/jobService";
import type { JobInput } from "../ui/types";
import { LoadingSpinner, ErrorMessage } from "./StatusDisplay";
import { useToast } from "../ui/Toast";
import { useAuth } from "../../hooks/useAuth";

const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl border border-border-light bg-white text-text-primary-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-text-secondary-light mb-1.5";

const JobFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as any;

    const { error: toastError, success: toastSuccess } = useToast();
    const { user } = useAuth();

    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<JobInput>({
        requestId: state?.requestId || "",
        title: state?.title || "",
        description: "",
        responsibility: "",
        requirement: "",
        benefit: "",
        quantity: state?.quantity || 1,
        status: "DRAFT",
        closedTime: "",
        hrId: user?.employeeId || "",
    });

    useEffect(() => {
        if (isEdit && id) {
            const fetchJob = async () => {
                try {
                    const res = await jobService.getById(id);
                    const job = res.data;
                    setFormData({
                        requestId: job.reqId || "", // reqId map to requestId
                        title: job.title || "",
                        description: job.description || "",
                        responsibility: job.responsibility || "",
                        requirement: job.requirement || "",
                        benefit: job.benefit || "",
                        quantity: job.quantity || 1,
                        status: job.status || "DRAFT",
                        closedTime: job.closedTime ? new Date(job.closedTime).toISOString().slice(0, 16) : "",
                        hrId: job.hrId || "",
                    });
                } catch (err) {
                    setError("Failed to load job details.");
                    toastError("Error", "Could not fetch details.");
                } finally {
                    setLoading(false);
                }
            };
            fetchJob();
        }
    }, [id, isEdit, toastError]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "quantity" ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent, targetStatus: "DRAFT" | "OPEN") => {
        e.preventDefault();
        try {
            setSubmitting(true);

            // Format datetime properly if needed for API
            const payload = {
                ...formData,
                status: targetStatus,
                closedTime: formData.closedTime ? new Date(formData.closedTime).toISOString() : ""
            };

            if (isEdit && id) {
                await jobService.update(id, payload);
                toastSuccess("Updated", "Job updated successfully.");
            } else {
                await jobService.create(payload);
                toastSuccess("Created", "Job created successfully.");
            }
            navigate("/recruitment/jobs");
        } catch (err) {
            toastError("Error", "Failed to save job.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-xl text-text-secondary-light hover:bg-gray-100 transition-colors cursor-pointer"
                >
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" clipRule="evenodd" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold font-heading text-text-primary-light tracking-tight">
                        {isEdit ? "Update Job" : "Post Job"}
                    </h1>
                    <p className="text-sm text-text-secondary-light">
                        {isEdit ? "Modify existing job posting details" : "Create a new job posting"}
                    </p>
                </div>
            </div>

            {error && <ErrorMessage message={error} />}

            <form onSubmit={(e) => handleSubmit(e, "OPEN")} className="space-y-6">
                <div className="rounded-2xl border border-border-light bg-white shadow-card p-6 md:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className={labelCls}>Job Title</label>
                            <input
                                required
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Senior Frontend Developer"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Quantity</label>
                            <input
                                required
                                type="number"
                                min="1"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Close Time</label>
                            <input
                                type="datetime-local"
                                name="closedTime"
                                value={formData.closedTime}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>Description</label>
                            <textarea
                                required
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Job description..."
                                className={`${inputCls} resize-none`}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>Responsibility</label>
                            <textarea
                                required
                                name="responsibility"
                                rows={3}
                                value={formData.responsibility}
                                onChange={handleChange}
                                placeholder="Job responsibilities..."
                                className={`${inputCls} resize-none`}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>Requirement</label>
                            <textarea
                                required
                                name="requirement"
                                rows={3}
                                value={formData.requirement}
                                onChange={handleChange}
                                placeholder="Job requirements..."
                                className={`${inputCls} resize-none`}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>Benefit</label>
                            <textarea
                                required
                                name="benefit"
                                rows={3}
                                value={formData.benefit}
                                onChange={handleChange}
                                placeholder="Job benefits..."
                                className={`${inputCls} resize-none`}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 rounded-xl border border-border-light text-sm font-semibold text-text-secondary-light hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e as unknown as React.FormEvent, "DRAFT")}
                        disabled={submitting}
                        className="px-6 py-2.5 rounded-xl border border-border-light text-sm font-semibold text-text-secondary-light hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        Save as Draft
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {isEdit ? "Update Job" : "Post Job"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JobFormPage;
