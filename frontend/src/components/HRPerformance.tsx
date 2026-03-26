import { kpiService } from "../services/kpiService";
import type { KpiLibrary, Department, KpiDetailDto, PerformanceCycle, CreateCycleRequest, PerformanceReview } from "../services/kpiService";
import { getToken } from "../services/authService";


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
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark opacity-50">
            <circle cx="10" cy="10" r="4" />
        </svg>
    ),
    cog: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors cursor-pointer">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
    ),
    search: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark cursor-pointer hover:text-primary transition-colors">
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
import { createPortal } from "react-dom";
import type { GlobalStats, DepartmentLeaderboardItem } from "../services/kpiService";


const HRPerformance = (_props: { activeTab: string, setActiveTab: (t: string) => void }) => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
    const [allKpis, setAllKpis] = useState<KpiLibrary[]>([]);
    const [globalKpis, setGlobalKpis] = useState<KpiLibrary[]>([]);
    const [structureDetails, setStructureDetails] = useState<KpiDetailDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddKpiModalOpen, setIsAddKpiModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'library' | 'new'>('library');
    const [viewMode, setViewMode] = useState<"global" | "specific" | "cycles" | "trainings">("global");
    const [globalStats, setGlobalStats] = useState<GlobalStats>({
        orgAverageScore: 0,
        totalKpiTargetValue: 0
    });
    const [leaderboard, setLeaderboard] = useState<DepartmentLeaderboardItem[]>([]);

    // Cycles state
    const [cycles, setCycles] = useState<PerformanceCycle[]>([]);
    const [cyclesLoading, setCyclesLoading] = useState(false);
    const [showCycleModal, setShowCycleModal] = useState(false);
    const [editingCycle, setEditingCycle] = useState<PerformanceCycle | null>(null);
    const [cycleForm, setCycleForm] = useState<CreateCycleRequest>({
        cycleName: '',
        startDate: '',
        endDate: ''
    });
    const [cycleSaving, setCycleSaving] = useState(false);
    const [cycleError, setCycleError] = useState('');
    const [cycleStatusError, setCycleStatusError] = useState('');
    const [publishError, setPublishError] = useState('');
    const [publishSuccess, setPublishSuccess] = useState('');
    const [createKpiError, setCreateKpiError] = useState('');
    const [createKpiSuccess, setCreateKpiSuccess] = useState('');

    const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
    const [cycleReviews, setCycleReviews] = useState<PerformanceReview[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    // Employee KPI Detail state
    const [selectedEmployeeReview, setSelectedEmployeeReview] = useState<PerformanceReview | null>(null);
    const [employeeGoals, setEmployeeGoals] = useState<any[]>([]);
    const [mentorAssessment, setMentorAssessment] = useState<any>(null);
    const [goalsLoading, setGoalsLoading] = useState(false);

    // Plan Training Modal State
    const [showPlanTrainingModal, setShowPlanTrainingModal] = useState(false);
    const [planTrainingForm, setPlanTrainingForm] = useState({
        courseName: '', courseUrl: '', deadline: '', reason: ''
    });
    const [planTrainingLoading, setPlanTrainingLoading] = useState(false);
    const [planTrainingError, setPlanTrainingError] = useState('');
    const [planTrainingSuccess, setPlanTrainingSuccess] = useState('');

    // Trainings (HR view) state
    const [allTrainings, setAllTrainings] = useState<any[]>([]);
    const [trainingsLoading, setTrainingsLoading] = useState(false);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [trainingStatusFilter, setTrainingStatusFilter] = useState<'ALL' | 'REGISTERED' | 'COMPLETED' | 'CONFIRMED'>('COMPLETED');
    const [previewCertUrl, setPreviewCertUrl] = useState<string | null>(null);
    const [certBlobUrl, setCertBlobUrl] = useState<string | null>(null);
    const [certFetchLoading, setCertFetchLoading] = useState(false);
    const [certFetchError, setCertFetchError] = useState<string | null>(null);
    const [trainingActionError, setTrainingActionError] = useState('');

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

    const handlePlanTrainingCreate = async () => {
        if (!planTrainingForm.courseName || !planTrainingForm.courseUrl || !planTrainingForm.deadline || !planTrainingForm.reason) {
            setPlanTrainingError('Please fill in all required fields.');
            return;
        }
        if (!selectedEmployeeReview?.employee?.employeeId || !selectedEmployeeReview?.reviewId) return;

        setPlanTrainingLoading(true);
        setPlanTrainingError('');
        try {
            // 1. Validate Deadline (Must be today or later)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const deadlineDate = new Date(planTrainingForm.deadline);
            if (deadlineDate < today) {
                setPlanTrainingError('Deadline cannot be in the past.');
                setPlanTrainingLoading(false);
                return;
            }

            // 2. Fetch existing trainings to check for duplicates for THIS employee
            const allCurrentTrainings = await kpiService.getAllTrainings();
            const normalizedUrl = planTrainingForm.courseUrl.trim().toLowerCase();
            const employeeId = selectedEmployeeReview.employee.employeeId;

            const isDuplicateUrlForThisEmployee = allCurrentTrainings.some((t: any) =>
                t.employeeId === employeeId &&
                t.course?.courseUrl?.trim().toLowerCase() === normalizedUrl
            );

            if (isDuplicateUrlForThisEmployee) {
                setPlanTrainingError(`Khóa học với URL này đã được giao cho nhân viên này rồi.`);
                setPlanTrainingLoading(false);
                return;
            }

            await kpiService.planTraining({
                employeeId: selectedEmployeeReview.employee.employeeId,
                reviewId: selectedEmployeeReview.reviewId,
                courseName: planTrainingForm.courseName,
                courseUrl: planTrainingForm.courseUrl,
                deadline: planTrainingForm.deadline,
                reason: planTrainingForm.reason,
            });
            setShowPlanTrainingModal(false);
            setPlanTrainingSuccess('Training planned successfully. Email assignment sent.');
            setPlanTrainingForm({ courseName: '', courseUrl: '', deadline: '', reason: '' });

            // Refresh training list if we are in that view
            if (viewMode === "trainings") {
                fetchAllTrainings();
            }
        } catch (e: any) {
            const errorMsg = e.response?.data?.error || e.response?.data?.message || 'Failed to plan training.';
            setPlanTrainingError(errorMsg);
        } finally {
            setPlanTrainingLoading(false);
        }
    };

    const handleViewCycleResults = async (cycleId: string) => {
        setSelectedCycleId(cycleId);
        setSelectedEmployeeReview(null);
        setReviewsLoading(true);
        try {
            const results = await kpiService.getReviewsByCycle(cycleId);
            setCycleReviews(results);
        } catch (error) {
            console.error(error);
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleViewEmployeeKpis = async (review: PerformanceReview) => {
        if (!selectedCycleId || !review.employee?.employeeId) return;
        setSelectedEmployeeReview(review);
        setGoalsLoading(true);
        setMentorAssessment(null);
        try {
            const [goals, assessment] = await Promise.all([
                kpiService.getGoalsByEmployeeAndCycle(review.employee.employeeId, selectedCycleId),
                kpiService.getMentorAssessment(review.reviewId)
            ]);
            setEmployeeGoals(goals);
            setMentorAssessment(assessment);
        } catch (error) {
            console.error(error);
        } finally {
            setGoalsLoading(false);
        }
    };

    // New KPI Form State
    const KPI_CATEGORIES = ['FINANCIAL', 'CUSTOMER', 'PROCESS'] as const;
    const MEASUREMENT_TYPES: { value: import('../services/kpiService').MeasurementType; label: string; desc: string }[] = [
        { value: 'NUMERIC', label: 'Numeric', desc: '' },
        { value: 'PERCENTAGE', label: 'Percentage', desc: '' },
        { value: 'BOOLEAN', label: 'Yes / No', desc: '' },
    ];
    const [newKpi, setNewKpi] = useState<{
        name: string;
        category: string;
        defaultWeight: number;
        measurementType: import('../services/kpiService').MeasurementType;
        description: string;
    }>({
        name: '',
        category: 'FINANCIAL',
        defaultWeight: 10,
        measurementType: 'NUMERIC',
        description: ''
    });

    // Search & Pagination
    const [kpiSearch, setKpiSearch] = useState('');
    const [kpiPage, setKpiPage] = useState(1);
    const KPI_PAGE_SIZE = 5;

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            const [deptsData, kpisData] = await Promise.all([
                kpiService.getAllDepartments(),
                kpiService.getAllKpiLibraries(selectedDeptId || undefined)
            ]);
            if (kpisData) setAllKpis(kpisData);
            if (deptsData && deptsData.length > 0) {
                setDepartments(deptsData);
                setSelectedDeptId(deptsData[0].id);
            }
            setLoading(false);
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (viewMode === 'global') {
            const fetchGlobalStats = async () => {
                const [statsData, leaderboardData] = await Promise.all([
                    kpiService.getGlobalStats(),
                    kpiService.getDepartmentLeaderboard()
                ]);
                setGlobalStats(statsData);
                setLeaderboard(leaderboardData);
            };
            fetchGlobalStats();
        } else if (viewMode === 'cycles') {
            setSelectedCycleId(null);
            const fetchCycles = async () => {
                setCyclesLoading(true);
                const data = await kpiService.getPerformanceCycles();
                setCycles(data);
                setCyclesLoading(false);
            };
            fetchCycles();
        }
    }, [viewMode]);

    // Fetch all trainings for HR when in trainings view
    const fetchAllTrainings = async () => {
        setTrainingsLoading(true);
        try {
            const data = await kpiService.getAllTrainings();
            setAllTrainings(data);
        } catch (e) {
            console.error(e);
        } finally {
            setTrainingsLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'trainings') {
            fetchAllTrainings();
        }
    }, [viewMode]);

    useEffect(() => {
        if (isAddKpiModalOpen && modalTab === 'library') {
            const fetchGlobal = async () => {
                const data = await kpiService.getAllKpiLibraries();
                setGlobalKpis(data);
            };
            fetchGlobal();
        }
    }, [isAddKpiModalOpen, modalTab]);

    useEffect(() => {
        if (selectedDeptId) {
            const fetchStructureAndKpis = async () => {
                setLoading(true);
                const [details, kpis] = await Promise.all([
                    kpiService.getKpisByDepartment(selectedDeptId),
                    kpiService.getAllKpiLibraries(selectedDeptId)
                ]);
                setAllKpis(kpis || []);
                if (details && details.length > 0) {
                    setStructureDetails(details);
                } else {
                    setStructureDetails([]);
                }
                setLoading(false);
            };
            fetchStructureAndKpis();
        }
    }, [selectedDeptId]);

    const handleWeightChange = (libraryId: string, newWeight: number) => {
        setPublishError('');
        setPublishSuccess('');
        setStructureDetails(prev => prev.map(d =>
            d.kpiLibraryId === libraryId ? { ...d, weight: newWeight } : d
        ));
    };

    const handleSave = async () => {
        if (!selectedDeptId) return;
        setPublishError('');
        setPublishSuccess('');

        if (currentTotalWeight !== 100) {
            setPublishError(`Total weight is ${currentTotalWeight}% — must equal exactly 100% before publishing.`);
            return;
        }

        const hasInvalidWeight = structureDetails.some(d => (d.weight || 0) <= 0);
        if (hasInvalidWeight) {
            setPublishError('Each KPI must have a weight greater than 0%. Please review your entries.');
            return;
        }

        try {
            await kpiService.assignKpisToDepartment({
                departmentId: selectedDeptId,
                details: structureDetails
            });
            setPublishSuccess('KPI Structure published successfully to all employees in this department!');
        } catch (e: any) {
            setPublishError(e.response?.data?.message || 'Fail to publish. Have no active cycle to publish.');
        }
    };

    // Save Draft: only saves the structure template, does NOT publish to employee goals.
    const handleSaveDraft = async () => {
        if (!selectedDeptId) return;
        setPublishError('');
        setPublishSuccess('');
        try {
            await kpiService.saveDraftKpiStructure({
                departmentId: selectedDeptId,
                details: structureDetails
            });
            setPublishSuccess('Draft saved! Structure has not been published to employees yet.');
        } catch (e) {
            setPublishError('Failed to save draft. Please try again.');
        }
    };

    // Cycle Handlers
    const openNewCycleModal = () => {
        setEditingCycle(null);
        setCycleForm({ cycleName: '', startDate: '', endDate: '' });
        setCycleError('');
        setShowCycleModal(true);
    };

    const openEditCycleModal = (cycle: PerformanceCycle) => {
        setEditingCycle(cycle);
        setCycleForm({
            cycleName: cycle.cycleName,
            startDate: cycle.startDate,
            endDate: cycle.endDate
        });
        setCycleError('');
        setShowCycleModal(true);
    };

    const handleSaveCycle = async () => {
        if (!cycleForm.cycleName || !cycleForm.startDate || !cycleForm.endDate) {
            setCycleError('Please fill in all required fields.');
            return;
        }

        if (new Date(cycleForm.endDate) < new Date(cycleForm.startDate)) {
            setCycleError('End Date cannot be before Start Date.');
            return;
        }

        setCycleSaving(true);
        setCycleError('');
        try {
            if (editingCycle) {
                const updated = await kpiService.updatePerformanceCycle(editingCycle.cycleId, cycleForm);
                setCycles(prev => prev.map(c => c.cycleId === updated.cycleId ? updated : c));
            } else {
                const created = await kpiService.createPerformanceCycle(cycleForm);
                setCycles(prev => [created, ...prev]);
            }
            setShowCycleModal(false);
        } catch (e: any) {
            console.error('Cycle save error:', e);
            const errorMsg = e.response?.data?.error || e.response?.data?.message || e.message || 'Failed to save cycle.';
            setCycleError(errorMsg);
        } finally {
            setCycleSaving(false);
        }
    };

    const handleCycleStatusChange = async (cycle: PerformanceCycle, newStatus: string) => {
        setCycleStatusError('');
        try {
            const updated = await kpiService.updateCycleStatus(cycle.cycleId, newStatus);
            setCycles(prev => prev.map(c => c.cycleId === updated.cycleId ? updated : c));
        } catch (e: any) {
            setCycleStatusError(e?.response?.data?.error || 'Cannot update status.');
        }
    };

    const activeDepartment = useMemo(() => {
        return departments.find(d => d.id === selectedDeptId);
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
        return globalKpis.filter(k => !structureDetails.some(d => d.kpiLibraryId === k.libId));
    }, [globalKpis, structureDetails]);

    // Filtered displayKpis based on search
    const filteredDisplayKpis = useMemo(() => {
        if (!kpiSearch.trim()) return displayKpis;
        const q = kpiSearch.toLowerCase();
        return displayKpis.filter(k =>
            (k.name || '').toLowerCase().includes(q) ||
            (k.category || '').toLowerCase().includes(q) ||
            (k.description || '').toLowerCase().includes(q)
        );
    }, [displayKpis, kpiSearch]);

    // Paginated
    const totalKpiPages = Math.ceil(filteredDisplayKpis.length / KPI_PAGE_SIZE);
    const paginatedKpis = useMemo(() => {
        const start = (kpiPage - 1) * KPI_PAGE_SIZE;
        return filteredDisplayKpis.slice(start, start + KPI_PAGE_SIZE);
    }, [filteredDisplayKpis, kpiPage, KPI_PAGE_SIZE]);

    const handleAddKpi = (kpi: KpiLibrary) => {
        if (structureDetails.some(d => d.kpiLibraryId === kpi.libId)) return; // already added
        setStructureDetails(prev => [...prev, { kpiLibraryId: kpi.libId, weight: kpi.defaultWeight }]);
    };

    const handleCreateAndAddKpi = async () => {
        // 1. Check Mandatory Fields
        if (!newKpi.name.trim()) {
            setCreateKpiError("KPI Name is required.");
            return;
        }
        if (!newKpi.category) {
            setCreateKpiError("Category is required.");
            return;
        }

        // 2. Check for duplicate name GLOBALLY (Across all categories)
        const trimmedName = newKpi.name.trim();
        const isDuplicate = allKpis.some(k =>
            k.name.trim().toLowerCase() === trimmedName.toLowerCase()
        );

        if (isDuplicate) {
            setCreateKpiError(`A KPI named "${trimmedName}" already exists in the system. Please use a unique name.`);
            return;
        }

        if (newKpi.defaultWeight <= 0) {
            setCreateKpiError("Default weight must be greater than 0%.");
            return;
        }
        try {
            const created = await kpiService.createKpiLibrary({
                ...newKpi,
                name: trimmedName,
                measurementType: newKpi.measurementType as import('../services/kpiService').MeasurementType,
                departmentId: selectedDeptId || undefined
            });
            setAllKpis(prev => [...prev, created]);
            handleAddKpi(created);
            setCreateKpiSuccess("New KPI created and added to department!");
            setTimeout(() => {
                setIsAddKpiModalOpen(false);
                setCreateKpiSuccess('');
                setNewKpi({ name: '', category: 'FINANCIAL', defaultWeight: 10, measurementType: 'NUMERIC', description: '' });
            }, 1000);
        } catch (e) {
            setCreateKpiError("Failed to create new KPI");
        }
    };

    // HR reject certificate — backend reads HR identity from JWT token
    const handleRejectCertificate = async (participantId: string) => {
        if (!window.confirm('Are you sure you want to reject this certificate? The employee will need to re-upload it.')) return;
        setConfirmingId(participantId);
        setTrainingActionError('');
        try {
            await kpiService.rejectTrainingCertificate(participantId);
            setAllTrainings(prev => prev.map(t =>
                t.participantId === participantId
                    ? { ...t, status: 'REJECTED', certificateUrl: null, hrConfirmedAt: null }
                    : t
            ));
        } catch (e: any) {
            console.error('Rejection error:', e);
            const errorMsg = e.response?.data?.error || e.response?.data?.message || e.message || 'Unknown error';
            setTrainingActionError(`Failed to reject certificate: ${errorMsg}`);
        } finally {
            setConfirmingId(null);
        }
    };

    const handleConfirmCertificate = async (participantId: string) => {
        setConfirmingId(participantId);
        setTrainingActionError('');
        try {
            await kpiService.confirmTrainingCertificate(participantId);
            setAllTrainings(prev => prev.map(t =>
                t.participantId === participantId
                    ? { ...t, status: 'CONFIRMED', hrConfirmedAt: new Date().toISOString() }
                    : t
            ));
        } catch (e: any) {
            const errorMsg = e.response?.data?.error || e.response?.data?.message || 'Failed to confirm certificate.';
            setTrainingActionError(errorMsg);
        } finally {
            setConfirmingId(null);
        }
    };

    const mainContent = (
        <div className="flex flex-col h-full space-y-5 animate-fade-in">
            {/* Header section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight uppercase">
                        {viewMode === 'global' ? 'Performance Overview' :
                            viewMode === 'specific' ? 'KPI Structure' :
                                viewMode === 'cycles' ? 'Evaluation Cycles' :
                                    'Training Management'}
                    </h1>
                    <p className="mt-1 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark opacity-70">
                        {viewMode === 'global' ? '' :
                            viewMode === 'specific' ? '' :
                                viewMode === 'cycles' ? '' :
                                    ''}
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    {/* View Switcher */}
                    <div className="flex bg-surface-2-light dark:bg-surface-2-dark p-1 rounded-xl shadow-inner border border-border-light dark:border-border-dark">
                        <button
                            onClick={() => setViewMode("global")}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === "global"
                                ? "bg-white dark:bg-surface-dark text-primary shadow-sm"
                                : "text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light"
                                }`}
                        >
                            Global
                        </button>
                        <button
                            onClick={() => setViewMode("specific")}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === "specific"
                                ? "bg-white dark:bg-surface-dark text-primary shadow-sm"
                                : "text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light"
                                }`}
                        >
                            Specific
                        </button>
                        <button
                            onClick={() => setViewMode("cycles")}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === "cycles"
                                ? "bg-white dark:bg-surface-dark text-primary shadow-sm"
                                : "text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light"
                                }`}
                        >
                            Cycles
                        </button>
                        <button
                            onClick={() => { setViewMode("trainings"); }}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === "trainings"
                                ? "bg-white dark:bg-surface-dark text-primary shadow-sm"
                                : "text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light"
                                }`}
                        >
                            Trainings
                        </button>
                    </div>

                </div>
            </div>

            {viewMode === "global" && (
                <div className="flex flex-col gap-6 animate-fade-in">
                    {/* Global KPI Metrics */}
                    <div className="grid grid-cols-2 gap-5">
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5 shadow-sm bento-card">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
                                Org Average Score
                            </h3>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold font-heading text-primary">{globalStats.orgAverageScore.toFixed(1)}</span>
                                <span className="text-sm font-bold text-green-500 mb-1">+2.4%</span>
                            </div>
                        </div>
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm bento-card">
                            <h3 className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-2">
                                Total KPIs Assigned
                            </h3>
                            <span className="text-3xl font-bold font-heading">{globalStats.totalKpiTargetValue.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Department Leaderboard */}
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm p-5 bento-card">
                            <h2 className="text-sm font-bold font-heading text-text-primary-light dark:text-text-primary-dark mb-6">
                                Department Leaderboard
                            </h2>
                            <div className="space-y-5">
                                {leaderboard.length === 0 ? (
                                    <div className="text-center py-10 text-text-muted-light text-xs font-bold uppercase tracking-widest italic opacity-50">
                                        No data available for current cycle
                                    </div>
                                ) : (
                                    leaderboard.map((dept, i) => {
                                        const colors = ["bg-blue-500", "bg-primary", "bg-accent-amber", "bg-gray-400"];
                                        const colorClass = colors[i] || "bg-gray-300";
                                        return (
                                            <div key={dept.departmentName}>
                                                <div className="flex justify-between text-sm font-bold mb-1.5">
                                                    <span>{dept.departmentName}</span>
                                                    <span>{dept.averageScore.toFixed(1)} pts</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-surface-2-light dark:bg-surface-2-dark rounded-full overflow-hidden">
                                                    <div className={`h-full ${colorClass} rounded-full transition-all duration-1000`} style={{ width: `${Math.min(100, dept.averageScore)}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Bell Curve (Score Distribution) */}
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm p-5 bento-card flex flex-col">
                            <h2 className="text-sm font-bold font-heading text-text-primary-light dark:text-text-primary-dark mb-6">
                                Company Score Distribution
                            </h2>
                            <div className="flex-1 flex items-end justify-between gap-2 px-4 h-48 relative">
                                {/* SVG Bell Curve overlay line mock */}
                                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                                    <path d="M 0 100 Q 25 100 40 50 T 50 10 Q 60 50 75 100" fill="none" stroke="rgba(124, 58, 237, 0.4)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                                </svg>

                                {/* Bars representing real bins */}
                                {(globalStats.scoreDistribution || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).map((count, i) => {
                                    const maxCount = Math.max(...(globalStats.scoreDistribution || [1]), 1);
                                    const heightPercent = Math.max(5, (count / maxCount) * 100);
                                    return (
                                        <div key={i} className="w-full bg-primary/20 rounded-t-sm hover:bg-primary/40 transition-colors group relative" style={{ height: `${heightPercent}%` }}>
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gray-800 text-white px-2 py-1 rounded shadow-lg pointer-events-none transition-opacity whitespace-nowrap z-20">
                                                {count} staff ({i * 10}-{i * 10 + 10} pts)
                                            </div>
                                        </div>
                                    );
                                })}
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

            {viewMode === "trainings" && (
                <div className="flex flex-col gap-5 animate-fade-in">
                    {/* Header + filter */}
                    <div className="flex items-center justify-between">
                        <div />
                        <div className="flex items-center gap-2">
                            <button onClick={fetchAllTrainings} className="p-2 rounded-lg border border-border-light text-text-secondary-light hover:bg-surface-2-light transition-colors text-xs font-bold">
                                ↻ Refresh
                            </button>
                            {(['ALL', 'REGISTERED', 'COMPLETED', 'CONFIRMED'] as const).map(s => (
                                <button key={s} onClick={() => setTrainingStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${trainingStatusFilter === s
                                        ? s === 'COMPLETED' ? 'bg-amber-500 text-white border-amber-500'
                                            : s === 'CONFIRMED' ? 'bg-emerald-500 text-white border-emerald-500'
                                                : 'bg-primary text-white border-primary'
                                        : 'bg-white border-border-light text-text-muted-light hover:border-primary/30'
                                        }`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {trainingActionError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 font-semibold bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                            {trainingActionError}
                            <button onClick={() => setTrainingActionError('')} className="ml-auto text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
                        </div>
                    )}

                    {trainingsLoading ? (
                        <div className="p-20 text-center text-text-muted-light font-black uppercase tracking-widest animate-pulse text-sm">Loading Trainings...</div>
                    ) : (
                        <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden bento-card">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-2-light/40 dark:bg-surface-2-dark/40 border-b border-border-light dark:border-border-dark">
                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em]">Employee</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em]">Course</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em] text-center">Deadline</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em] text-center">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em] text-center">Certificate</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted-light uppercase tracking-[0.2em] text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {allTrainings
                                        .filter(t => trainingStatusFilter === 'ALL' || t.status === trainingStatusFilter)
                                        .map((t: any) => (
                                            <tr key={t.participantId} className="group hover:bg-primary/[0.02] transition-colors">
                                                <td className="px-6 py-5 border-l-4 border-transparent group-hover:border-primary transition-colors">
                                                    <div className="font-bold text-sm text-text-primary-light dark:text-text-primary-dark group-hover:text-primary transition-colors">{t.employeeName || 'Unknown'}</div>
                                                    <div className="text-[11px] text-text-muted-light mt-0.5">{t.employeeId?.slice(0, 8)}...</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="font-semibold text-sm text-text-primary-light">{t.course?.courseName || 'N/A'}</div>
                                                    <div className="text-[11px] text-text-muted-light mt-0.5 bg-surface-2-light px-2 py-0.5 rounded inline-block">{t.course?.platform || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="text-sm font-bold text-text-secondary-light">
                                                        {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${t.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                        : t.status === 'COMPLETED' ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                            : t.status === 'FAILED' ? 'bg-rose-100 text-rose-700 border-rose-200'
                                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                                        }`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    {t.certificateUrl ? (
                                                        <button
                                                            onClick={() => setPreviewCertUrl(
                                                                t.certificateUrl.startsWith('http')
                                                                    ? t.certificateUrl
                                                                    : t.certificateUrl
                                                            )}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black uppercase rounded-lg border border-primary/20 transition-colors cursor-pointer"
                                                        >
                                                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" /></svg>
                                                            View Cert
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-text-muted-light italic">Not submitted</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    {t.status === 'COMPLETED' ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleRejectCertificate(t.participantId)}
                                                                disabled={confirmingId === t.participantId}
                                                                className="px-4 py-2.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 disabled:opacity-50 transition-all"
                                                            >
                                                                {confirmingId === t.participantId ? '...' : 'Reject'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleConfirmCertificate(t.participantId)}
                                                                disabled={confirmingId === t.participantId}
                                                                className="px-5 py-2.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 disabled:opacity-50 transition-all"
                                                            >
                                                                {confirmingId === t.participantId ? 'Confirming...' : '✓ Confirm'}
                                                            </button>
                                                        </div>
                                                    ) : t.status === 'CONFIRMED' ? (
                                                        <div className="text-right">
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase">
                                                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                                                                Confirmed
                                                            </span>
                                                            {t.hrConfirmedAt && <div className="text-[10px] text-text-muted-light mt-0.5">{new Date(t.hrConfirmedAt).toLocaleDateString()}</div>}
                                                        </div>
                                                    ) : t.status === 'REJECTED' ? (
                                                        <span className="text-[10px] text-rose-600 font-black uppercase tracking-widest">Rejected</span>
                                                    ) : (
                                                        <span className="text-[10px] text-text-muted-light italic">Awaiting certificate</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    {allTrainings.filter(t => trainingStatusFilter === 'ALL' || t.status === trainingStatusFilter).length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-16 text-center text-text-muted-light font-bold text-sm">
                                                No training records found for this filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {viewMode === "specific" && (
                <div className="flex gap-6 items-start animate-fade-in-up">
                    {/* Left Column (Main Content) */}
                    <div className="flex-1 space-y-6">
                        {/* Top Stats Row */}
                        <div className="grid grid-cols-2 gap-5">
                            {/* Departments Pendng Review */}
                            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm bento-card">
                                <h3 className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-3">
                                    Total Departments
                                </h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold font-heading">{departments.length}</span>
                                </div>
                            </div>

                            {/* Global Weight Total */}
                            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm bento-card flex flex-col">
                                <h3 className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-3 whitespace-nowrap overflow-hidden text-ellipsis">
                                    Total Weight Configured
                                </h3>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className={`text-3xl font-bold font-heading ${currentTotalWeight === 100 ? 'text-primary' : currentTotalWeight > 100 ? 'text-red-500' : 'text-accent-amber'}`}>
                                        {currentTotalWeight}%
                                    </span>

                                </div>
                            </div>
                        </div>

                        {/* KPI Structure Definition Header */}
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden flex flex-col">
                            <div className="px-5 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-surface-light dark:bg-surface-dark gap-3">
                                <div>
                                    <h2 className="text-lg font-bold font-heading text-text-primary-light dark:text-text-primary-dark">
                                        KPI Structure Definition:
                                    </h2>
                                    <h2 className="text-lg font-bold font-heading text-primary">
                                        {activeDepartment ? activeDepartment.name : "N/A"}
                                    </h2>
                                </div>

                                {/* Search KPI */}
                                <div className="flex-1 max-w-xs relative">
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-light dark:text-text-muted-dark pointer-events-none">
                                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search KPI name, category..."
                                        value={kpiSearch}
                                        onChange={(e) => { setKpiSearch(e.target.value); setKpiPage(1); }}
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-surface-2-light dark:bg-surface-2-dark border border-border-light dark:border-border-dark rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                                    />
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
                                        <tr className="border-b border-border-light dark:border-border-dark">
                                            <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest w-[35%]">
                                                KPI Item & Category
                                            </th>
                                            <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest w-[20%] text-center">
                                                Mandatory Weight
                                            </th>
                                            <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest w-[35%]">
                                                Measurement Logic
                                            </th>
                                            <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest text-right">
                                                Settings
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-6 text-center text-text-muted-light dark:text-text-muted-dark">
                                                    Loading KPIs...
                                                </td>
                                            </tr>
                                        ) : paginatedKpis.length === 0 && kpiSearch ? (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-6 text-center text-text-muted-light dark:text-text-muted-dark">
                                                    No KPIs match &quot;{kpiSearch}&quot;.
                                                </td>
                                            </tr>
                                        ) : filteredDisplayKpis.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-6 text-center text-text-muted-light dark:text-text-muted-dark">
                                                    No KPIs assigned to this department yet.
                                                </td>
                                            </tr>
                                        ) : paginatedKpis.map((kpi) => (
                                            <tr key={kpi.kpiLibraryId} className="table-row-hover hover:bg-surface-2-light/50 dark:hover:bg-surface-2-dark/50 p-2">
                                                <td className="px-5 py-6">
                                                    <div className="font-semibold text-[15px] text-text-primary-light dark:text-text-primary-dark">
                                                        {kpi.name}
                                                    </div>
                                                    <div className="text-[13px] text-text-muted-light dark:text-text-muted-dark font-medium mt-1 tracking-wide">
                                                        {kpi.category}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-6 flex justify-center">
                                                    <input
                                                        type="number"
                                                        value={kpi.weight}
                                                        onChange={(e) => handleWeightChange(kpi.kpiLibraryId, Number(e.target.value))}
                                                        className="w-20 px-3 py-2 text-center bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm font-semibold text-text-primary-light dark:text-text-primary-dark shadow-sm focus-ring"
                                                    />
                                                </td>
                                                <td className="px-5 py-6">
                                                    <div className="text-[14px] text-text-secondary-light dark:text-text-secondary-dark font-medium pr-4">
                                                        {kpi.description}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-6 text-right">
                                                    <button
                                                        onClick={() => setStructureDetails(prev => prev.filter(d => d.kpiLibraryId !== kpi.kpiLibraryId))}
                                                        className="text-text-muted-light dark:text-text-muted-dark hover:text-red-500 transition-colors cursor-pointer"
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

                            {/* Pagination */}
                            {totalKpiPages > 1 && (
                                <div className="px-5 py-3 border-t border-border-light dark:border-border-dark flex items-center justify-between">
                                    <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                                        Showing {(kpiPage - 1) * KPI_PAGE_SIZE + 1}–{Math.min(kpiPage * KPI_PAGE_SIZE, filteredDisplayKpis.length)} of {filteredDisplayKpis.length} KPIs
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setKpiPage(p => Math.max(1, p - 1))}
                                            disabled={kpiPage === 1}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-2-light dark:hover:bg-surface-2-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            ← Prev
                                        </button>
                                        {Array.from({ length: totalKpiPages }, (_, i) => i + 1).map(pg => (
                                            <button
                                                key={pg}
                                                onClick={() => setKpiPage(pg)}
                                                className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${pg === kpiPage
                                                    ? 'bg-primary text-white shadow-sm'
                                                    : 'border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-2-light dark:hover:bg-surface-2-dark'
                                                    }`}
                                            >
                                                {pg}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setKpiPage(p => Math.min(totalKpiPages, p + 1))}
                                            disabled={kpiPage === totalKpiPages}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-surface-2-light dark:hover:bg-surface-2-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>{/* close KPI structure card */}

                        {/* Action Bar */}
                        <div className="pt-2 flex flex-col items-center gap-3">
                            <div className="flex gap-4">
                                <button
                                    onClick={handleSaveDraft}
                                    className="px-6 py-2.5 rounded-lg text-sm font-bold border border-primary text-primary hover:bg-primary/5 transition-colors shadow-sm bg-surface-light dark:bg-surface-dark"
                                >
                                    Save Draft
                                </button>

                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm bg-primary text-white hover:bg-primary-hover"
                                >
                                    Publish to Employees
                                </button>
                            </div>

                            {/* Inline error / success feedback */}
                            {publishError && (
                                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2.5 w-full max-w-lg">
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                    </svg>
                                    {publishError}
                                </div>
                            )}
                            {publishSuccess && (
                                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-2.5 w-full max-w-lg">
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                    </svg>
                                    {publishSuccess}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-80 flex-shrink-0 space-y-6">
                        {/* Department Directory */}
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden flex flex-col bento-card">
                            <div className="px-5 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                                <h2 className="text-sm font-bold font-heading text-text-primary-light dark:text-text-primary-dark">
                                    Department Directory
                                </h2>

                            </div>
                            <div className="p-2 space-y-1">
                                {departments.length === 0 ? (
                                    <div className="text-center text-xs text-text-muted-light dark:text-text-muted-dark py-4">No departments found.</div>
                                ) : departments.map((dept) => (
                                    <div
                                        key={dept.id}
                                        onClick={() => setSelectedDeptId(dept.id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors relative overflow-hidden group
                                            ${selectedDeptId === dept.id
                                                ? "bg-primary/5 border border-primary/20"
                                                : "border border-transparent hover:bg-surface-2-light dark:hover:bg-surface-2-dark"
                                            }
                                        `}
                                    >
                                        {selectedDeptId === dept.id && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>
                                        )}

                                        <div className="w-9 h-9 rounded-lg bg-surface-2-light dark:bg-surface-2-dark flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark flex-shrink-0">
                                            {selectedDeptId === dept.id ? <span className="text-primary">{Icons.building}</span> : Icons.building}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark truncate pr-2">
                                                {dept.name}
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0 px-1">
                                            {selectedDeptId === dept.id && Icons.dotGreen}
                                        </div>
                                    </div>
                                ))}
                            </div>


                        </div>


                    </div>
                </div>
            )}

            {/* ─── REVIEW CYCLE VIEW ──────────────────────────────────────────── */}
            {viewMode === "cycles" && (
                <div className="flex flex-col gap-6 animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div />
                        {!selectedCycleId && (
                            <button
                                onClick={openNewCycleModal}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                                New Cycle
                            </button>
                        )}
                    </div>

                    {selectedCycleId ? (
                        selectedEmployeeReview ? (
                            /* ─── EMPLOYEE KPI DETAIL VIEW ─────────────────────────── */
                            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden flex flex-col animate-fade-in">
                                <div className="px-5 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-surface-light dark:bg-surface-dark gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base">
                                            {(selectedEmployeeReview.employee?.fullName || 'U')[0]}
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                                                {selectedEmployeeReview.employee?.fullName || 'Unknown'}
                                            </h2>
                                            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">KPI Breakdown Detail</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <button
                                            onClick={() => {
                                                setPlanTrainingError('');
                                                setPlanTrainingSuccess('');
                                                setPlanTrainingForm({ courseName: '', courseUrl: '', deadline: '', reason: '' });
                                                setShowPlanTrainingModal(true);
                                            }}
                                            className="px-4 py-2 text-sm font-bold bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors shadow-sm"
                                        >
                                            Plan Training
                                        </button>
                                        <button
                                            onClick={() => setSelectedEmployeeReview(null)}
                                            className="px-4 py-2 text-sm font-semibold rounded-lg border border-border-light text-text-secondary-light hover:bg-surface-2-light transition-colors"
                                        >
                                            ← Back to Results
                                        </button>
                                    </div>
                                </div>

                                {planTrainingSuccess && (
                                    <div className="m-5 mb-0 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-semibold">
                                        {planTrainingSuccess}
                                    </div>
                                )}

                                {/* Score Summary Cards */}
                                <div className="grid grid-cols-3 gap-4 p-5">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                        <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-1">Manager: KPI Score (70%)</p>
                                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{selectedEmployeeReview.kpiScore ?? '-'}</p>
                                    </div>
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                        <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest mb-1">Mentor: Attitude (30%)</p>
                                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{selectedEmployeeReview.attitudeScore ?? '-'}</p>
                                    </div>
                                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                                        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-1">Overall Assessment</p>
                                        <p className="text-2xl font-black text-primary">{selectedEmployeeReview.overallScore !== null && selectedEmployeeReview.overallScore !== undefined ? selectedEmployeeReview.overallScore.toFixed(1) : '-'}</p>
                                    </div>
                                </div>

                                {/* Mentor Assessment Detail */}
                                {mentorAssessment && (
                                    <div className="px-5 pb-4">
                                        <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3">Mentor Assessment Breakdown</h3>
                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="bg-surface-2-light dark:bg-surface-2-dark rounded-lg p-3 flex flex-col items-center justify-center text-center">
                                                <p className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-1">Teamwork</p>
                                                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{mentorAssessment.teamworkScore ?? '-'}</p>
                                            </div>
                                            <div className="bg-surface-2-light dark:bg-surface-2-dark rounded-lg p-3 flex flex-col items-center justify-center text-center">
                                                <p className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-1">Communication</p>
                                                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{mentorAssessment.communicationScore ?? '-'}</p>
                                            </div>
                                            <div className="bg-surface-2-light dark:bg-surface-2-dark rounded-lg p-3 flex flex-col items-center justify-center text-center">
                                                <p className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-1">Technical</p>
                                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{mentorAssessment.technicalScore ?? '-'}</p>
                                            </div>
                                            <div className="bg-surface-2-light dark:bg-surface-2-dark rounded-lg p-3 flex flex-col items-center justify-center text-center">
                                                <p className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-1">Adaptability</p>
                                                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{mentorAssessment.adaptabilityScore ?? '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* KPI Goals Table */}
                                <div className="px-5 pb-2">
                                    <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-3">Manager KPI Detail Completion</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-y border-border-light dark:border-border-dark bg-surface-2-light/60 dark:bg-surface-2-dark/60">
                                                <th className="px-5 py-3 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest">KPI Name</th>
                                                <th className="px-5 py-3 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest text-center">Weight</th>
                                                <th className="px-5 py-3 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest text-center">Target</th>
                                                <th className="px-5 py-3 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest text-center">Actual</th>
                                                <th className="px-5 py-3 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest text-center">Completion</th>
                                                <th className="px-5 py-3 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                            {goalsLoading ? (
                                                <tr><td colSpan={6} className="px-5 py-8 text-center text-text-muted-light dark:text-text-muted-dark">Loading KPI details...</td></tr>
                                            ) : employeeGoals.length === 0 ? (
                                                <tr><td colSpan={6} className="px-5 py-8 text-center text-text-muted-light dark:text-text-muted-dark">No KPI goals assigned for this employee in this cycle.</td></tr>
                                            ) : (
                                                employeeGoals.map((goal: any) => {
                                                    const target = goal.targetValue || 0;
                                                    const current = goal.currentValue || 0;
                                                    const completion = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
                                                    const goalStatusColors: Record<string, string> = {
                                                        ASSIGNED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                                                        ACKNOWLEDGED: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                                                        SUBMITTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                                                        COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                                                    };
                                                    return (
                                                        <tr key={goal.goalId} className="hover:bg-surface-2-light/50 dark:hover:bg-surface-2-dark/50 transition-colors">
                                                            <td className="px-5 py-4">
                                                                <div className="font-semibold text-sm text-text-primary-light dark:text-text-primary-dark">
                                                                    {goal.kpiLibrary?.name || goal.title || 'Unnamed KPI'}
                                                                </div>
                                                                {goal.kpiLibrary?.category && (
                                                                    <div className="text-[11px] text-text-muted-light dark:text-text-muted-dark mt-0.5">{goal.kpiLibrary.category}</div>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-4 text-center font-bold text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                                                {goal.weight != null ? `${goal.weight}%` : '-'}
                                                            </td>
                                                            <td className="px-5 py-4 text-center font-bold text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                                                {target}
                                                            </td>
                                                            <td className="px-5 py-4 text-center font-bold text-sm text-text-primary-light dark:text-text-primary-dark">
                                                                {current}
                                                            </td>
                                                            <td className="px-5 py-4 text-center">
                                                                <div className="flex items-center gap-2 justify-center">
                                                                    <div className="w-16 h-2 bg-surface-2-light dark:bg-surface-2-dark rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all duration-500 ${completion >= 100 ? 'bg-emerald-500' : completion >= 50 ? 'bg-primary' : 'bg-amber-500'}`}
                                                                            style={{ width: `${completion}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className={`text-xs font-bold ${completion >= 100 ? 'text-emerald-600' : completion >= 50 ? 'text-primary' : 'text-amber-600'}`}>
                                                                        {completion}%
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 text-center">
                                                                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${goalStatusColors[goal.status] || 'bg-gray-100 text-gray-600'}`}>
                                                                    {goal.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            /* ─── EMPLOYEE RESULTS LIST ─────────────────────────── */
                            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden flex flex-col">
                                <div className="px-5 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-surface-light dark:bg-surface-dark gap-3">
                                    <div>
                                        <h2 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                                            Employee Results
                                        </h2>
                                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">Click on an employee to view KPI breakdown</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedCycleId(null)}
                                        className="px-4 py-2 text-sm font-semibold rounded-lg border border-border-light text-text-secondary-light hover:bg-surface-2-light transition-colors"
                                    >
                                        Back to Cycles
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border-light bg-surface-2-light/60">
                                                <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light uppercase tracking-widest">Employee</th>
                                                <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light uppercase tracking-widest text-center">KPI (70%)</th>
                                                <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light uppercase tracking-widest text-center">Attitude (30%)</th>
                                                <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light uppercase tracking-widest text-center">Overall</th>
                                                <th className="px-5 py-4 text-[11px] font-bold text-text-muted-light uppercase tracking-widest text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-light">
                                            {reviewsLoading ? (
                                                <tr>
                                                    <td colSpan={5} className="px-5 py-8 text-center text-text-muted-light">Loading results...</td>
                                                </tr>
                                            ) : cycleReviews.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-5 py-8 text-center text-text-muted-light">No evaluations submitted for this cycle yet.</td>
                                                </tr>
                                            ) : (
                                                cycleReviews.map((review) => (
                                                    <tr
                                                        key={review.reviewId}
                                                        onClick={() => handleViewEmployeeKpis(review)}
                                                        className="hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors cursor-pointer group"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-surface-2-light dark:bg-surface-2-dark flex items-center justify-center text-xs font-bold text-text-muted-light dark:text-text-muted-dark group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                                    {(review.employee?.fullName || 'U')[0]}
                                                                </div>
                                                                <div>
                                                                    <span className="font-semibold text-sm text-text-primary-light dark:text-text-primary-dark group-hover:text-primary transition-colors">
                                                                        {review.employee?.fullName || 'Unknown Employee'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 text-center font-bold text-text-secondary-light">
                                                            {review.kpiScore ?? '-'}
                                                        </td>
                                                        <td className="px-5 py-4 text-center font-bold text-text-secondary-light">
                                                            {review.attitudeScore ?? '-'}
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <span className="text-base font-black text-primary">
                                                                {review.overallScore !== null && review.overallScore !== undefined ? review.overallScore.toFixed(1) : '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${review.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : review.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700' : review.status === 'DRAFT' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
                                                                {review.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    ) : (
                        <>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-5">
                                {[{
                                    label: 'Total Cycles', value: cycles.length, color: 'text-text-primary-light dark:text-text-primary-dark'
                                }, {
                                    label: 'Active', value: cycles.filter(c => c.status === 'ACTIVE').length, color: 'text-primary'
                                }, {
                                    label: 'Closed', value: cycles.filter(c => c.status === 'CLOSED').length, color: 'text-text-muted-light dark:text-text-muted-dark'
                                }].map((s, i) => (
                                    <div key={i} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm">
                                        <p className="text-xs font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest mb-2">{s.label}</p>
                                        <p className={`text-4xl font-bold font-heading ${s.color}`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Cycle Status Error */}
                            {cycleStatusError && (
                                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 shadow-sm">
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                                    {cycleStatusError}
                                </div>
                            )}

                            {/* Cycle Table */}
                            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-border-light dark:border-border-dark bg-surface-2-light/60 dark:bg-surface-2-dark/60">
                                            {['Cycle Name', 'Period', 'Status', 'Manage Status', 'Details'].map(h => (
                                                <th key={h} className={`px-5 py-3.5 text-[11px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-widest ${h === 'Details' ? 'text-right' : ''}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                        {cyclesLoading ? (
                                            <tr><td colSpan={4} className="px-5 py-8 text-center text-text-muted-light">Loading cycles...</td></tr>
                                        ) : cycles.length === 0 ? (
                                            <tr><td colSpan={4} className="px-5 py-10 text-center">
                                                <div className="text-text-muted-light dark:text-text-muted-dark">
                                                    <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    <p className="text-sm font-semibold">No review cycles yet.</p>
                                                    <p className="text-xs mt-1">Click "New Cycle" to get started.</p>
                                                </div>
                                            </td></tr>
                                        ) : cycles.map(cycle => {
                                            const statusColors: Record<string, string> = {
                                                ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                                                CLOSED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                                            };
                                            return (
                                                <tr key={cycle.cycleId} className="hover:bg-surface-2-light/50 dark:hover:bg-surface-2-dark/50 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <p className="font-bold text-sm text-text-primary-light dark:text-text-primary-dark">{cycle.cycleName}</p>
                                                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                                                            Created {cycle.createdAt ? new Date(cycle.createdAt).toLocaleDateString('vi-VN') : '—'}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                                        <p className="font-semibold">{cycle.startDate} → {cycle.endDate}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${statusColors[cycle.status] || ''}`}>
                                                            {cycle.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {cycle.status === 'ACTIVE' && (
                                                                <button
                                                                    onClick={() => openEditCycleModal(cycle)}
                                                                    className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
                                                                </button>
                                                            )}
                                                            {cycle.status === 'ACTIVE' && (
                                                                <button
                                                                    onClick={() => handleCycleStatusChange(cycle, 'CLOSED')}
                                                                    className="px-3 py-1.5 text-[11px] font-bold bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                                                >
                                                                    Close
                                                                </button>
                                                            )}
                                                            {cycle.status === 'CLOSED' && (
                                                                <span className="text-xs text-text-muted-light dark:text-text-muted-dark italic">Archived</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <button
                                                            onClick={() => handleViewCycleResults(cycle.cycleId)}
                                                            className="px-3 py-1.5 text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors border border-primary/20"
                                                        >
                                                            View Results
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}
            {/* Add KPI Modal Overlay */}
            {isAddKpiModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-surface-2-light/50 dark:bg-surface-2-dark/50">
                            <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark font-heading">
                                Add KPI to Department
                            </h2>
                            <button
                                onClick={() => setIsAddKpiModalOpen(false)}
                                className="text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light transition-colors"
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex px-6 pt-4 space-x-4 border-b border-border-light dark:border-border-dark">
                            <button
                                onClick={() => setModalTab('library')}
                                className={`pb-2 text-sm font-semibold transition-colors ${modalTab === 'library' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'}`}
                            >
                                From Library
                            </button>
                            <button
                                onClick={() => setModalTab('new')}
                                className={`pb-2 text-sm font-semibold transition-colors ${modalTab === 'new' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'}`}
                            >
                                Create New KPI
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {modalTab === 'library' ? (
                                availableKpis.length === 0 ? (
                                    <div className="text-center text-text-muted-light dark:text-text-muted-dark py-10">
                                        No available KPIs to add. All existing KPIs from the Library have been assigned to this department!
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {availableKpis.map(kpi => (
                                            <div key={kpi.libId} className="flex justify-between items-center p-4 border border-border-light dark:border-border-dark rounded-lg hover:bg-surface-2-light dark:hover:bg-surface-2-dark transition-colors">
                                                <div>
                                                    <div className="font-bold text-text-primary-light dark:text-text-primary-dark">{kpi.name}</div>
                                                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{kpi.category}</div>
                                                    {kpi.description && <div className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">{kpi.description}</div>}
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
                                        <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1">KPI Name</label>
                                        <input
                                            type="text"
                                            value={newKpi.name}
                                            onChange={e => setNewKpi({ ...newKpi, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus-ring"
                                            placeholder="e.g. Sales Target Completion"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1">Category</label>
                                            <select
                                                value={newKpi.category}
                                                onChange={e => setNewKpi({ ...newKpi, category: e.target.value })}
                                                className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus-ring"
                                            >
                                                {KPI_CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1">Default Weight</label>
                                            <input
                                                type="number"
                                                value={newKpi.defaultWeight}
                                                onChange={e => setNewKpi({ ...newKpi, defaultWeight: Number(e.target.value) })}
                                                className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus-ring"
                                            />
                                        </div>
                                    </div>
                                    {/* Measurement Type */}
                                    <div>
                                        <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                                            Measurement Type
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {MEASUREMENT_TYPES.map(mt => (
                                                <div
                                                    key={mt.value}
                                                    onClick={() => setNewKpi({ ...newKpi, measurementType: mt.value })}
                                                    className={`px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${newKpi.measurementType === mt.value
                                                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                                        : 'border-border-light dark:border-border-dark bg-gray-50 hover:border-primary/50'
                                                        }`}
                                                >
                                                    <div className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">{mt.label}</div>
                                                    <div className="text-[11px] text-text-muted-light dark:text-text-muted-dark mt-0.5">{mt.desc}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1">Description (Optional)</label>
                                        <textarea
                                            value={newKpi.description}
                                            onChange={e => setNewKpi({ ...newKpi, description: e.target.value })}
                                            className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus-ring"
                                            rows={2}
                                        />
                                    </div>
                                    {createKpiError && (
                                        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 mt-2">
                                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                                            {createKpiError}
                                        </div>
                                    )}
                                    {createKpiSuccess && (
                                        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-2 mt-2">
                                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                                            {createKpiSuccess}
                                        </div>
                                    )}
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
                        <div className="px-6 py-4 border-t border-border-light dark:border-border-dark bg-surface-2-light/50 dark:bg-surface-2-dark/50 flex justify-end">
                            <button
                                onClick={() => setIsAddKpiModalOpen(false)}
                                className="px-6 py-2 rounded-lg text-sm font-bold border border-border-light dark:border-border-dark hover:bg-surface-3-light dark:hover:bg-surface-3-dark transition-colors text-text-primary-light dark:text-text-primary-dark"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>, document.body
            )}

            {/* ─── CREATE PLAN TRAINING MODAL ───────────────────────── */}
            {showPlanTrainingModal && createPortal(
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
                            <h3 className="text-lg font-bold font-heading text-text-primary-light dark:text-text-primary-dark">
                                Plan Training for {selectedEmployeeReview?.employee?.fullName || 'Employee'}
                            </h3>
                            <button onClick={() => setShowPlanTrainingModal(false)} className="text-text-muted-light hover:text-text-primary-light transition-colors">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {planTrainingError && (
                                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-semibold">
                                    {planTrainingError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1">Course Name *</label>
                                <input
                                    type="text"
                                    value={planTrainingForm.courseName}
                                    onChange={e => setPlanTrainingForm(f => ({ ...f, courseName: e.target.value }))}
                                    placeholder="e.g. Advanced Excel Analysis"
                                    className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1">Course Link (Coursera) *</label>
                                <input
                                    type="text"
                                    value={planTrainingForm.courseUrl}
                                    onChange={e => setPlanTrainingForm(f => ({ ...f, courseUrl: e.target.value }))}
                                    placeholder="https://coursera.org/..."
                                    className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1">Deadline *</label>
                                <input
                                    type="date"
                                    value={planTrainingForm.deadline}
                                    onChange={e => setPlanTrainingForm(f => ({ ...f, deadline: e.target.value }))}
                                    className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1">Reason for Training *</label>
                                <textarea
                                    value={planTrainingForm.reason}
                                    onChange={e => setPlanTrainingForm(f => ({ ...f, reason: e.target.value }))}
                                    placeholder="e.g. Needs improvement on data aggregation as per Q1 review."
                                    rows={3}
                                    className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-light dark:border-border-dark bg-surface-2-light/40 dark:bg-surface-2-dark/40">
                            <button
                                onClick={() => setShowPlanTrainingModal(false)}
                                className="px-5 py-2 text-sm font-semibold border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark rounded-lg hover:bg-surface-2-light dark:hover:bg-surface-2-dark transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePlanTrainingCreate}
                                disabled={planTrainingLoading}
                                className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center gap-2"
                            >
                                {planTrainingLoading && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                                {planTrainingLoading ? 'Saving...' : 'Assign Training'}
                            </button>
                        </div>
                    </div>
                </div>, document.body
            )}

            {/* ─── CREATE / EDIT CYCLE MODAL ─────────────────────────────────── */}
            {showCycleModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
                            <h3 className="text-lg font-bold font-heading text-text-primary-light dark:text-text-primary-dark">
                                {editingCycle ? '✏️ Edit Review Cycle' : '🗓️ Create New Review Cycle'}
                            </h3>
                            <button onClick={() => setShowCycleModal(false)} className="text-text-muted-light hover:text-text-primary-light transition-colors">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5 overflow-y-auto">
                            {cycleError && (
                                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 font-medium">
                                    {cycleError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1.5">Cycle Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={cycleForm.cycleName}
                                    onChange={e => setCycleForm(f => ({ ...f, cycleName: e.target.value }))}
                                    placeholder="e.g. Q1 2026 Performance Review"
                                    className="w-full px-4 py-2.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1.5">Start Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        value={cycleForm.startDate}
                                        onChange={e => setCycleForm(f => ({ ...f, startDate: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-primary-light dark:text-text-primary-dark mb-1.5">End Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        min={cycleForm.startDate}
                                        value={cycleForm.endDate}
                                        onChange={e => setCycleForm(f => ({ ...f, endDate: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-light dark:border-border-dark bg-surface-2-light/40 dark:bg-surface-2-dark/40">
                            <button
                                onClick={() => setShowCycleModal(false)}
                                className="px-5 py-2 text-sm font-semibold border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark rounded-lg hover:bg-surface-2-light dark:hover:bg-surface-2-dark transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCycle}
                                disabled={cycleSaving}
                                className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center gap-2"
                            >
                                {cycleSaving && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                                {cycleSaving ? 'Saving...' : editingCycle ? 'Save Changes' : 'Create Cycle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Certificate preview modal (portal)
    const certPreviewModal = previewCertUrl && createPortal(
        <div
            className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4"
            onClick={() => setPreviewCertUrl(null)}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
                    <div>
                        <h3 className="font-black text-sm text-text-primary-light uppercase tracking-widest">Certificate Preview</h3>
                        <p className="text-[11px] text-text-muted-light mt-0.5">Review the submitted training certificate</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href={certBlobUrl || previewCertUrl!}
                            download="certificate"
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors"
                        >
                            ↓ Download
                        </a>
                        <button
                            onClick={() => setPreviewCertUrl(null)}
                            className="p-2 rounded-lg text-text-muted-light hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center min-h-[500px]">
                    {certFetchLoading ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <span className="text-xs font-black text-text-muted-light uppercase tracking-widest">Fetching file securely...</span>
                        </div>
                    ) : certFetchError ? (
                        <div className="flex flex-col items-center gap-3 text-red-500 max-w-xs text-center">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-12 h-12 opacity-20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-black uppercase tracking-widest">Failed to load certificate</span>
                            <p className="text-[10px] font-medium opacity-60 leading-relaxed">{certFetchError}</p>
                        </div>
                    ) : certBlobUrl ? (
                        <>
                            {previewCertUrl!.toLowerCase().includes('.pdf') ? (
                                <iframe
                                    src={certBlobUrl}
                                    className="w-full h-[600px] rounded-xl border border-border-light bg-white"
                                    title="Certificate PDF"
                                />
                            ) : (
                                <div className="relative flex flex-col items-center">
                                    <img
                                        src={certBlobUrl}
                                        alt="Training Certificate"
                                        className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl border border-white"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            const errEl = (e.target as HTMLImageElement).nextElementSibling;
                                            if (errEl) errEl.classList.remove('hidden');
                                        }}
                                    />
                                    <div className="hidden flex flex-col items-center gap-2 text-text-muted-light">
                                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-12 h-12 opacity-20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Unsupported or corrupted file</span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </div>,
        document.body
    );

    return (
        <>
            {mainContent}
            {certPreviewModal}
        </>
    );
};

export default HRPerformance;
