import { useState, useEffect } from "react";
import apiClient from "../../../../services/apiClient";
import type { CreateNewHireDTO } from "../../hooks/types";

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface PositionOption {
  id: string;
  title: string;
}

export interface JobData {
  posId: string;
  deptId: string;
  deptName: string;
  posName: string;
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

        const dept =
          departments.find((d) => d.id === job.deptId) ||
          departments.find((d) => d.name.toLowerCase() === job.deptName?.toLowerCase());
        const pos = positions.find((p) => p.id === job.posId);

        setFormData((prev) => ({
          ...prev,
          departmentId: dept?.id || prev.departmentId,
          positionId: pos?.id || job.posId || prev.positionId,
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
