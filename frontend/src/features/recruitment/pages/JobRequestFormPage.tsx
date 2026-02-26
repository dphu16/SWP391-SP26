import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jobRequestService } from "../services/jobRequestService";
import type { JobRequestInput } from "../types";
import { LoadingSpinner, ErrorMessage } from "../components/StatusDisplay";
import { useToast } from "../../../shared/components/ui/Toast";

const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-1.5";

const JobRequestFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { error: toastError, success: toastSuccess } = useToast();

    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<JobRequestInput>({
        title: "",
        deptId: "",
        quantity: 1,
        location: "Remote",
        type: "FULL_TIME",
        reportTo: "",
        reason: "",
        status: "PENDING",
        comment: "",
    });

    useEffect(() => {
        if (isEdit && id) {
            const fetchRequest = async () => {
                try {
                    const res = await jobRequestService.getById(id);
                    setFormData(res.data);
                } catch (err) {
                    setError("Failed to load job request details.");
                    toastError("Error", "Could not fetch details.");
                } finally {
                    setLoading(false);
                }
            };
            fetchRequest();
        }
    }, [id, isEdit, toastError]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "quantity" ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (isEdit && id) {
                await jobRequestService.update(id, formData);
                toastSuccess("Updated", "Job request updated successfully.");
            } else {
                await jobRequestService.create(formData);
                toastSuccess("Created", "Job request created successfully.");
            }
            navigate("/recruitment/job-requests");
        } catch (err) {
            toastError("Error", "Failed to save job request.");
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
                    className="p-2 rounded-xl text-text-secondary-light hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" clipRule="evenodd" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight">
                        {isEdit ? "Update Job Request" : "Post Job Request"}
                    </h1>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {isEdit ? "Modify existing hiring request details" : "Create a new hiring request for approval"}
                    </p>
                </div>
            </div>

            {error && <ErrorMessage message={error} />}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card p-6 md:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className={labelCls}>Job Title / Role Name</label>
                            <input
                                required
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Senior Product Designer"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Department ID (UUID)</label>
                            <input
                                required
                                name="deptId"
                                value={formData.deptId}
                                onChange={handleChange}
                                placeholder="00000000-0000-0000-0000-000000000000"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Headcount (Quantity)</label>
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
                            <label className={labelCls}>Work Location</label>
                            <input
                                required
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g. Remote, Hanoi, Office"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Employment Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className={inputCls}
                            >
                                <option value="FULL_TIME">Full-time</option>
                                <option value="PART_TIME">Part-time</option>
                                <option value="CONTRACT">Contract</option>
                                <option value="INTERNSHIP">Internship</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Reports To (Manager ID)</label>
                            <input
                                name="reportTo"
                                value={formData.reportTo}
                                onChange={handleChange}
                                placeholder="Optional ID"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Status (for HR/Admins)</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className={inputCls}
                            >
                                <option value="PENDING">Pending Approval</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>Business Reason / Justification</label>
                            <textarea
                                required
                                name="reason"
                                rows={4}
                                value={formData.reason}
                                onChange={handleChange}
                                placeholder="Explain why this position is needed..."
                                className={`${inputCls} resize-none`}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>HR Comments / Feedback</label>
                            <textarea
                                name="comment"
                                rows={3}
                                value={formData.comment}
                                onChange={handleChange}
                                placeholder="Internal notes or approval terms..."
                                className={`${inputCls} resize-none`}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 rounded-xl border border-border-light dark:border-border-dark text-sm font-semibold text-text-secondary-light hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {isEdit ? "Update Request" : "Submit Request"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JobRequestFormPage;
