import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../../../services/apiClient";
import { sendApprovalRequest } from "../../../services/approvalService";
import type { CreateNewHireDTO } from "./types";
import { makeDefaultFormData } from "../onboarding/formConstants";

const API_URL = "/api/employees/new";

export type FieldErrors = Record<string, string>;

export const useCandidateOnboarding = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
        if (!formData.fullName.trim())
          errors.fullName = "Full Name is required.";
        if (!formData.email.trim()) errors.email = "Email Address is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
          errors.email = "Invalid email format.";
        if (formData.phone && !/^[0-9+\-\s]{8,15}$/.test(formData.phone.trim()))
          errors.phone = "Invalid phone number format.";
        if (!formData.dateOfBirth)
          errors.dateOfBirth = "Date of Birth is required.";
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
        if (!formData.dateOfJoining)
          errors.dateOfJoining = "Joining Date is required.";
        if (!formData.startDate) errors.startDate = "Start Date is required.";
        if (!formData.baseSalary || formData.baseSalary <= 0)
          errors.baseSalary = "Base Salary must be greater than 0.";
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
    [formData],
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
          try {
            await sendApprovalRequest(employeeId);
            setToast({
              message:
                "Employee successfully created and approval request sent!",
              type: "success",
            });
            setTimeout(() => navigate("/onboarding"), 1500);
          } catch (err: any) {
            const errorMsg =
              err.response?.data?.message ||
              err.response?.data?.error ||
              err.message ||
              "Unknown error";
            setSubmitError(
              `Employee created, but failed to send approval request: ${errorMsg}`,
            );
            setToast({
              message: "Failed to send approval request.",
              type: "error",
            });
            return;
          }
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
