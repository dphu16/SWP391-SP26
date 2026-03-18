import { useState, useEffect, useRef } from "react";
import apiClient from "../../../../services/apiClient";
import type { CreateNewHireDTO } from "../../hooks/types";

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface PositionOption {
  id: string;
  title: string;
  deptId?: string;
  deptName?: string;
}

export interface JobData {
  posId: string;
  deptId: string;
  deptName: string;
  posName: string;
  type?: string;
}

export const useEmploymentData = () => {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    Promise.all([
      apiClient.get<DepartmentOption[]>("/api/lookup/departments"),
      apiClient.get<PositionOption[]>("/api/lookup/positions"),
    ])
      .then(([deptRes, posRes]) => {
        if (cancelled) return;
        setDepartments(deptRes.data);
        setPositions(posRes.data);
      })
      .catch(() => {
        if (!cancelled) setFetchError("Failed to load lookup data. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { departments, positions, loading, fetchError };
};

export const useJobAutoFill = (
  jobId: string | undefined,
  loading: boolean,
  departments: DepartmentOption[],
  positions: PositionOption[],
  setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>>
) => {
  const [jobAutoFilled, setJobAutoFilled] = useState(false);

  useEffect(() => {
    if (!jobId || jobAutoFilled || loading || departments.length === 0 || positions.length === 0)
      return;
    let cancelled = false;

    apiClient
      .get<JobData>(`/api/jobs/${jobId}`)
      .then((res) => {
        if (cancelled) return;
        const job = res.data;

        // 1. Get position from Job
        const pos = positions.find((p) => p.id === job.posId);
        
        // 2. From position -> get department by id
        const dept = pos?.deptId ? departments.find((d) => d.id === pos.deptId) : null;
        
        // II. Get status from job type
        const jobStatus = job.type || "";

        setFormData((prev) => ({
          ...prev,
          departmentId: dept?.id || prev.departmentId,
          positionId: pos?.id || job.posId || prev.positionId,
          status: jobStatus || prev.status,
          // 3. Ensure managerId is not assigned from job data
        }));
        setJobAutoFilled(true);
      })
      .catch(() => {
        // Silently ignore — user can still pick manually
      });

    return () => {
      cancelled = true;
    };
  }, [jobId, loading, departments, positions, jobAutoFilled, setFormData]);

  return { jobAutoFilled };
};

/**
 * When the user selects a position, automatically set the department
 * to match the position's department_id from the Position table.
 * This ensures Department always corresponds to the selected Position.
 */
export const usePositionDepartmentSync = (
  positions: PositionOption[],
  departments: DepartmentOption[],
  formData: CreateNewHireDTO,
  setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>>
) => {
  const prevPositionId = useRef(formData.positionId);

  useEffect(() => {
    // Only react when positionId actually changes
    if (formData.positionId === prevPositionId.current) return;
    prevPositionId.current = formData.positionId;

    if (!formData.positionId || positions.length === 0) return;

    const selectedPosition = positions.find((p) => p.id === formData.positionId);
    if (!selectedPosition?.deptId) return;

    // Only update if the department doesn't already match
    const matchingDept = departments.find((d) => d.id === selectedPosition.deptId);
    if (matchingDept && formData.departmentId !== matchingDept.id) {
      setFormData((prev) => ({
        ...prev,
        departmentId: matchingDept.id,
      }));
    }
  }, [formData.positionId, positions, departments, formData.departmentId, setFormData]);
};

