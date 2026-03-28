import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../../../services/apiClient";
import type { CreateNewHireDTO } from "./types";
import { makeDefaultFormData } from "../onboarding/formConstants";
import { useEmploymentData } from "../onboarding/hooks/useEmploymentData";

const API_URL = "/api/employees/new";

export type FieldErrors = Record<string, string>;

export const useCandidateOnboarding = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { positions } = useEmploymentData();

  const action = searchParams.get("action") || "init";
  const isResubmit = action === "resubmit";

  const candidateName = searchParams.get("name") || "";
  const candidateEmail = searchParams.get("email") || "";
  const candidatePhone = searchParams.get("phone") || "";
  const [jobTitle, setJobTitle] = useState(searchParams.get("job") || "");
  const jobId = searchParams.get("jobId") || "";

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(isResubmit);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [formData, setFormData] = useState<CreateNewHireDTO>(
    makeDefaultFormData(
      candidateName,
      candidatePhone,
      candidateEmail,
      isResubmit ? undefined : applicationId,
    ),
  );

  // Fetch job title from backend if jobId is present
  useEffect(() => {
    if (!jobId || isResubmit) return;

    apiClient
      .get<{ posName: string }>(`/api/jobs/${jobId}`)
      .then((res) => {
        if (res.data?.posName) {
          setJobTitle(res.data.posName);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch job details:", err);
      });
  }, [jobId, isResubmit]);

  // Load existing employee data for resubmit mode
  useEffect(() => {
    if (!isResubmit || !applicationId) return;
    let cancelled = false;
    setLoadingEmployee(true);
    apiClient
      .get<CreateNewHireDTO>(`/api/employees/${applicationId}/edit`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        setFormData({
          fullName: data.fullName || "",
          phone: data.phone || "",
          email: data.email || "",
          gender: data.gender || "MALE",
          address: data.address || "",
          departmentId: data.departmentId || "",
          positionId: data.positionId || "",
          citizenId: data.citizenId || "",
          taxCode: data.taxCode || "",
          dateOfBirth: data.dateOfBirth || "",
          avatarUrl: data.avatarUrl || "",
          sourceApplicationId: null,
          managerId: data.managerId || "",
          dateOfJoining: data.dateOfJoining || "",
          role: data.role || "ROLE_EMPLOYEE",
          status: data.status || "",
          contractNumber: data.contractNumber || "",
          startDate: data.startDate || "",
          endDate: data.endDate || "",
          baseSalary: data.baseSalary || 0,
        });
      })
      .catch(() => {
        if (!cancelled)
          setToast({ message: "Failed to load employee data.", type: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoadingEmployee(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isResubmit, applicationId]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateStep = useCallback(
    (step: number): string | null => {
      const errors: FieldErrors = {};

      if (step === 0) {
        if (!formData.fullName.trim()) {
          errors.fullName = "Full Name is required.";
        } else if (/\d/.test(formData.fullName)) {
          errors.fullName = "Full Name cannot contain numbers.";
        }

        if (!formData.email.trim()) errors.email = "Email Address is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
          errors.email = "Invalid email format.";
        if (formData.phone && !/^[0-9+\-\s]{8,15}$/.test(formData.phone.trim()))
          errors.phone = "Invalid phone number format.";
        
        if (!formData.dateOfBirth) {
          errors.dateOfBirth = "Date of Birth is required.";
        } else {
          const dob = new Date(formData.dateOfBirth);
          const today = new Date();
          let age = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
          }
          if (age < 18) {
            errors.dateOfBirth = "Candidate must be at least 18 years old.";
          }
        }

        if (!formData.citizenId || formData.citizenId.trim().length === 0)
          errors.citizenId = "Citizen ID is required.";
        else if (formData.citizenId.trim().length < 9)
          errors.citizenId = "Citizen ID must be at least 9 characters.";
        if (!formData.taxCode || formData.taxCode.trim().length === 0)
          errors.taxCode = "Tax ID is required.";
        else if (formData.taxCode.trim().length < 10)
          errors.taxCode = "Tax ID must be at least 10 characters.";
        if (!formData.address.trim()) errors.address = "Address is required.";
      }

      if (step === 1) {
        if (!formData.departmentId)
          errors.departmentId = "Please select a department.";
        if (!formData.positionId)
          errors.positionId = "Please select a position.";
        if (!formData.status) errors.status = "Please select a target status.";
        
        if (!formData.dateOfJoining) {
          errors.dateOfJoining = "Joining Date is required.";
        } else {
          const joiningDate = new Date(formData.dateOfJoining);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (joiningDate < today) {
            errors.dateOfJoining = "Joining Date cannot be in the past.";
          }
        }

        if (!formData.startDate) errors.startDate = "Start Date is required.";
        if (!formData.baseSalary || formData.baseSalary <= 0) {
          errors.baseSalary = "Base Salary must be greater than 0.";
        } else {
          // Calculate dynamically based on position
          let minStr = "0";
          let maxStr = "9.999.999.999.999";
          let actualMin = 0;
          let actualMax = 9999999999999;
          
          if (formData.positionId) {
            const pos = positions.find(p => String(p.id) === String(formData.positionId));
            if (pos) {
              const bMin = (pos.baseSalaryMin !== undefined && pos.baseSalaryMin !== null) ? pos.baseSalaryMin : 0;
              const bMax = (pos.baseSalaryMax !== undefined && pos.baseSalaryMax !== null) ? pos.baseSalaryMax : 9999999999999;
              
              actualMin = Math.min(bMin, bMax);
              actualMax = Math.max(bMin, bMax);
              minStr = actualMin.toLocaleString("vi-VN");
              maxStr = actualMax.toLocaleString("vi-VN");
            }
          }

          if (formData.baseSalary < actualMin || formData.baseSalary > actualMax) {
            errors.baseSalary = `Hệ thống hoặc vị trí chỉ cho phép từ ${minStr} VND đến ${maxStr} VND.`;
          }
        }

        if (
          formData.endDate &&
          formData.startDate &&
          formData.endDate < formData.startDate
        )
          errors.endDate = "End Date must be after Start Date.";
      }

      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        const first = Object.values(errors)[0];
        return first;
      }
      return null;
    },
    [formData, positions],
  );

  // Clear field error when user edits the field
  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleNext = () => {
    const err = validateStep(currentStep);
    if (err) {
      setToast({ message: err, type: "error" });
      return;
    }
    setCurrentStep(1);
  };

  const handleBack = () => setCurrentStep(0);
  const handleGoBack = () =>
    navigate(isResubmit ? "/onboarding/progress" : "/onboarding");



  const handleSubmit = async () => {
    const err = validateStep(currentStep);
    if (err) {
      setToast({ message: err, type: "error" });
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      if (isResubmit && applicationId) {
        await apiClient.put(
          `/api/employees/${applicationId}/resubmit`,
          formData,
        );
        setToast({
          message: "Employee updated and resubmitted for approval!",
          type: "success",
        });
        setTimeout(() => navigate("/onboarding/progress"), 1500);
      } else {
        const response = await apiClient.post(API_URL, formData);
        const employeeId = response.data?.employeeId;

        if (employeeId) {
          setToast({
            message: "Employee successfully created and submitted for manager approval!",
            type: "success",
          });
          setTimeout(() => navigate("/onboarding"), 1500);
        } else {
          setToast({
            message: "Employee successfully created!",
            type: "success",
          });
          setTimeout(() => navigate("/onboarding"), 1500);
        }
      }
    } catch (err: unknown) {
      let message = "An unexpected error occurred.";
      if (err instanceof Error && "response" in err) {
        const axErr = err as {
          response?: { status: number; statusText: string; data?: any };
        };
        const data = axErr.response?.data;
        message =
          data?.message ||
          data?.error ||
          `Error ${axErr.response?.status}: ${axErr.response?.statusText}`;

        if (data?.details) {
          message +=
            " - " +
            (Array.isArray(data.details)
              ? data.details.join(", ")
              : String(data.details));
        } else if (data?.errors) {
          if (typeof data.errors === "object" && !Array.isArray(data.errors)) {
            const vals = Object.values(data.errors).filter(Boolean);
            if (vals.length > 0) message = vals.join(", ");
          } else if (Array.isArray(data.errors)) {
            message = data.errors
              .map((e: any) => e.defaultMessage || e.message || String(e))
              .join(", ");
          } else {
            message += " - " + String(data.errors);
          }
        } else if (typeof data === "string") {
          message = data;
        }
      }

      // Check for PostgreSQL numeric overflow error
      if (
        message.includes("numeric field overflow") ||
        message.includes("precision 15, scale 2") ||
        message.includes("10^13")
      ) {
        let maxMsg = "9.999.999.999.999";
        let minMsg = "0";
        
        if (formData.positionId) {
          const pos = positions.find((p) => String(p.id) === String(formData.positionId));
          if (pos) {
            const bMin = (pos.baseSalaryMin !== undefined && pos.baseSalaryMin !== null) ? pos.baseSalaryMin : 0;
            const bMax = (pos.baseSalaryMax !== undefined && pos.baseSalaryMax !== null) ? pos.baseSalaryMax : 9999999999999;
            minMsg = Math.min(bMin, bMax).toLocaleString("vi-VN");
            maxMsg = Math.max(bMin, bMax).toLocaleString("vi-VN");
          }
        }
        const exactMsg = `Hệ thống hoặc vị trí chỉ cho phép từ ${minMsg} VND đến ${maxMsg} VND.`;
        setFieldErrors((prev) => ({ ...prev, baseSalary: exactMsg }));
        setToast({ message: exactMsg, type: "error" });
        return;
      }

      setSubmitError(message);
      setToast({ message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    applicationId,
    jobTitle,
    jobId,
    isResubmit,
    currentStep,
    setCurrentStep,
    submitting,
    submitError,
    loadingEmployee,
    toast,
    setToast,
    formData,
    setFormData,
    fieldErrors,
    clearFieldError,
    handleNext,
    handleBack,
    handleGoBack,
    handleSubmit,
  };
};
