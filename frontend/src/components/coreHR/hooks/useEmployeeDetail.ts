import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import apiClient from "../../../services/apiClient";
import { getToken } from "../../../services/authService";
import { decodeJwt } from "../../../utils/jwtDecode";
import type { EmployeeDetailDTO, DependentDTO } from "../detail/types";
import { API_BASE } from "../detail/types";

export type TabType = "General" | "Job";

const isValidUUID = (val?: string) =>
  !!val &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export const useEmployeeDetail = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation();
  const isProfile = location.pathname === "/profile";
  const token = getToken();
  const id = isProfile ? decodeJwt(token)?.employeeId : paramId;

  const [detail, setDetail] = useState<EmployeeDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("General");
  const [dependents, setDependents] = useState<DependentDTO[]>([]);

  useEffect(() => {
    if (!isValidUUID(id)) return;
    const fetchEmployeeDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<EmployeeDetailDTO>(
          `${API_BASE}/${id}/view-detail`,
        );
        setDetail(res.data);
      } catch (err: unknown) {
        if (err instanceof Error && "response" in err) {
          const axErr = err as {
            response?: { status: number; statusText: string };
          };
          setError(
            axErr.response?.status === 404
              ? "Không tìm thấy nhân viên."
              : `Lỗi ${axErr.response?.status}: ${axErr.response?.statusText}`,
          );
        } else {
          setError("Đã xảy ra lỗi không xác định.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeDetail();
  }, [id]);

  useEffect(() => {
    if (!isValidUUID(id)) return;
    const fetchDependents = async () => {
      try {
        const res = await apiClient.get<DependentDTO[]>(
          `/api/v1/employees/${id}/dependents`,
        );
        setDependents(res.data);
      } catch (err: unknown) {
        if (err instanceof Error && "response" in err) {
          const axErr = err as { response?: { status: number } };
          if (axErr.response?.status !== 404) setDependents([]);
        }
      }
    };
    fetchDependents();
  }, [id]);

  return {
    id,
    detail,
    setDetail,
    loading,
    error,
    activeTab,
    setActiveTab,
    dependents,
    setDependents,
  };
};
