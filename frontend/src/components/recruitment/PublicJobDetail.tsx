import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jobService } from "../../services/jobService";
import { applicationService } from "../../services/applicationService";
import type { Job } from "../ui/types";
import { useToast } from "../ui/Toast";

const formatTimeLeft = (closedTime: string | null) => {
    if (!closedTime) return "Open until filled";
    const closeDate = new Date(closedTime);
    const now = new Date();
    const diffMs = closeDate.getTime() - now.getTime();
    if (diffMs <= 0) return "Closed";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 24) {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} days left`;
    }
    return `${diffHours} hours left`;
};

const PublicJobDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { error: toastError, success: toastSuccess } = useToast();

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [showApplyForm, setShowApplyForm] = useState(false);

    const [applicantName, setApplicantName] = useState("");
    const [applicantEmail, setApplicantEmail] = useState("");
    const [applicantPhone, setApplicantPhone] = useState("");
    const [applicantCv, setApplicantCv] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;
        const fetchJob = async () => {
            try {
                setLoading(true);
                const res = await jobService.getById(id);
                setJob(res.data);
            } catch (err: any) {
                toastError("Error", "Could not fetch job details.");
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id, toastError]);

    const handleSubmitApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!job) return;

        if (!applicantName || !applicantEmail || !applicantPhone || !applicantCv) {
            toastError("Validation Error", "Please fill in all fields and attach a CV.");
            return;
        }

        try {
            setIsSubmitting(true);

            const formData = new FormData();
            formData.append("jobId", job.id);
            formData.append("fullName", applicantName);
            formData.append("email", applicantEmail);
            formData.append("phone", applicantPhone);
            formData.append("cvUrl", applicantCv);

            await applicationService.applyJob(formData);

            toastSuccess("Success", "Your application has been submitted successfully!");
            // Reset form
            setApplicantName("");
            setApplicantEmail("");
            setApplicantPhone("");
            setApplicantCv(null);
        } catch (err: any) {
            toastError("Error", "Could not submit application. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full overflow-y-auto bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-start">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="h-full overflow-y-auto bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-center pt-24">
                <h3 className="text-xl font-medium text-gray-900">Job not found</h3>
                <button onClick={() => navigate("/careers")} className="mt-4 text-primary hover:underline">
                    Back to Jobs
                </button>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 animate-fade-in relative pb-32">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate("/careers")}
                    className="mb-8 flex items-center text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to list
                </button>

                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <h1 className="text-3xl font-extrabold text-gray-900">{job.title}</h1>
                        {!showApplyForm && (
                            <button
                                onClick={() => {
                                    setShowApplyForm(true);
                                    setTimeout(() => {
                                        document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                }}
                                className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/30"
                            >
                                Apply Now
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-4 mb-8">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                            {job.type || "FULL_TIME"}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location || "Anywhere"}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {job.salary || "Negotiable"}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-sm font-medium">
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Closing: {formatTimeLeft(job.closedTime)}
                        </span>
                    </div>

                    <div className="space-y-8 text-gray-700">
                        {job.description && (
                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Job Description</h3>
                                <div className="prose prose-blue max-w-none whitespace-pre-wrap">{job.description}</div>
                            </section>
                        )}
                        {job.responsibility && (
                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Responsibilities</h3>
                                <div className="prose prose-blue max-w-none whitespace-pre-wrap">{job.responsibility}</div>
                            </section>
                        )}
                        {job.requirement && (
                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Requirements</h3>
                                <div className="prose prose-blue max-w-none whitespace-pre-wrap">{job.requirement}</div>
                            </section>
                        )}
                        {job.benefit && (
                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Benefits</h3>
                                <div className="prose prose-blue max-w-none whitespace-pre-wrap">{job.benefit}</div>
                            </section>
                        )}
                    </div>
                </div>

                {showApplyForm && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-fade-in" id="apply-form">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-2xl font-bold text-gray-900">
                                Apply for this position
                            </h3>
                            <p className="text-gray-500 mt-1">Please fill out the form below to submit your application.</p>
                        </div>
                        <form onSubmit={handleSubmitApplication} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={applicantName}
                                        onChange={(e) => setApplicantName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={applicantEmail}
                                        onChange={(e) => setApplicantEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        value={applicantPhone}
                                        onChange={(e) => setApplicantPhone(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">CV (PDF only)</label>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        required
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setApplicantCv(e.target.files[0]);
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all border border-gray-200 rounded-xl bg-white shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 text-base font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-lg shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Submitting Application...
                                        </>
                                    ) : (
                                        "Submit Application"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicJobDetail;
