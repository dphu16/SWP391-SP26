import React, { useState } from "react";
import apiClient from "../../../services/apiClient";
import { employeeSelfUpdateService } from "../../../services/personnelChangeService";
import { useAuth } from "../../../hooks/useAuth";
import type {
  EmployeeDetailDTO,
  DependentDTO,
} from "./types";
import { formatDate } from "./types";
import { InfoRow, SectionCard, IconButton } from "./ui";
import { EditIcon, CheckIcon } from "./Icons";

interface GeneralTabProps {
  detail: EmployeeDetailDTO;
  dep: DependentDTO | undefined;
  setDep: (d: DependentDTO) => void;
  employeeId: string;
  onDetailUpdated: (d: EmployeeDetailDTO) => void;
}

const EDITABLE_FIELDS = ["phone", "address"] as const;
type EditableField = (typeof EDITABLE_FIELDS)[number];

const GeneralTab: React.FC<GeneralTabProps> = ({
  detail,
  dep,
  setDep,
  employeeId,
  onDetailUpdated,
}) => {
  const { user, hasRole } = useAuth();
  const isOwner = user?.employeeId === employeeId;
  const isHR = hasRole("HR");
  const canEdit = isOwner || isHR;

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);


  // HR Edit states
  const [isEditingDep, setIsEditingDep] = useState(false);
  const [depForm, setDepForm] = useState({
    fullName: "",
    phone: "",
    relationship: "",
    address: "",
  });
  const [savingDep, setSavingDep] = useState(false);





  const startEditing = () => {
    setEditForm({
      phone: detail.phone || "",
      address: detail.address || "",
    });
    setEditError(null);
    setEditSuccess(false);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditError(null);
    setEditSuccess(false);
  };

  const handleSave = async () => {
    if (!editForm.phone.trim()) {
      setEditError("Số điện thoại không được để trống.");
      return;
    }
    try {
      setSaving(true);
      setEditError(null);

      let res;
      if (isOwner && !isHR) {
        res = await employeeSelfUpdateService.selfUpdate(editForm);
      } else {
        res = await apiClient.put<EmployeeDetailDTO>(
          `/api/employees/${employeeId}/edit`,
          editForm,
        );
      }
      onDetailUpdated(res.data);
      setEditSuccess(true);
      setIsEditing(false);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err: unknown) {
      if (err instanceof Error && "response" in err) {
        const axErr = err as {
          response?: {
            status: number;
            data?: { message?: string; error?: string };
            statusText: string;
          };
        };
        setEditError(
          axErr.response?.data?.message ||
            axErr.response?.data?.error ||
            `Lỗi ${axErr.response?.status}: Không thể lưu thay đổi.`,
        );
      } else {
        setEditError("Đã xảy ra lỗi không xác định.");
      }
    } finally {
      setSaving(false);
    }
  };

  const editableFieldConfig = [
    {
      label: "Phone Number",
      field: "phone" as EditableField,
      type: "tel",
      required: true,
    },
    {
      label: "Address",
      field: "address" as EditableField,
      type: "text",
      required: false,
    },
  ];

  return (
    <>
      {editSuccess && (
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl animate-slide-up mb-4">
          <span className="w-4 h-4 text-emerald-500">
            <CheckIcon />
          </span>
          <p className="text-sm font-medium text-emerald-700">
            Changes saved successfully
          </p>
        </div>
      )}

      <SectionCard
        title="Personal Information"
        action={
          canEdit ? (
            !isEditing ? (
              <IconButton
                onClick={startEditing}
                title="Edit personal info"
                variant="default"
              >
                <EditIcon />
              </IconButton>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEditing}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-100 text-text-secondary-light hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-50 btn-primary-action"
                >
                  {saving && (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            )
          ) : null
        }
      >
        {editError && (
          <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 animate-slide-up">
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5"
            >
              <path
                fillRule="evenodd"
                d="M8 15A7 7 0 108 1a7 7 0 000 14zm0-11a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 018 4zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs font-medium text-rose-700">{editError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
          <InfoRow label="Full Name" value={detail.fullName} />
          <InfoRow label="Gender" value={detail.gender} />
          <InfoRow
            label="Date of Birth"
            value={formatDate(detail.dateOfBirth)}
          />
          <InfoRow label="Citizen ID" value={detail.citizenId} />
          <InfoRow label="Email Address" value={detail.email} />
          <InfoRow label="Employee Code" value={detail.employeeCode} />
          <InfoRow label="Tax Code" value={detail.taxCode} />
          <InfoRow
            label="Date of Joining"
            value={formatDate(detail.dateOfJoining)}
          />

          {editableFieldConfig.map(({ label, field, type, required }) => {
            return (
              <div key={field}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light mb-1">
                  {label}
                  {required && isEditing && (
                    <span className="text-rose-500 ml-0.5">*</span>
                  )}
                </p>
                {isEditing ? (
                  <input
                    type={type}
                    value={editForm[field]}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                    placeholder={label}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border-light bg-white text-text-primary-light placeholder:text-text-muted-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                ) : (
                  <p className="text-sm font-medium text-text-primary-light">
                    {detail[field] || "—"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Emergency Contact"
        action={
          isHR ? (
            !isEditingDep ? (
              <IconButton
                title="Edit emergency contact"
                variant="default"
                onClick={() => {
                  setDepForm({
                    fullName: dep?.fullName || "",
                    phone: dep?.phone || "",
                    relationship: dep?.relationship || "",
                    address: dep?.address || "",
                  });
                  setIsEditingDep(true);
                }}
              >
                <EditIcon />
              </IconButton>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingDep(false)}
                  disabled={savingDep}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-100 text-text-secondary-light hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setSavingDep(true);
                    try {
                      let res;
                      if (dep?.id) {
                        // Update existing
                        res = await apiClient.put<DependentDTO>(
                          `/api/v1/employees/dependents/${dep.id}`,
                          depForm,
                        );
                      } else {
                        // Create new (HR creating dependent for employee)
                        res = await apiClient.post<DependentDTO>(
                          `/api/v1/employees/${employeeId}/dependents`,
                          depForm,
                        );
                      }
                      setDep(res.data);
                      setIsEditingDep(false);
                      setEditSuccess(true);
                      setTimeout(() => setEditSuccess(false), 3000);
                    } catch (e) {
                      setEditError("Lỗi khi cập nhật liên hệ khẩn cấp");
                    } finally {
                      setSavingDep(false);
                    }
                  }}
                  disabled={savingDep}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-50 btn-primary-action"
                >
                  {savingDep ? "Saving…" : "Save Changes"}
                </button>
              </div>
            )
          ) : null
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
          {isEditingDep ? (
            <>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light mb-1">Full Name</p>
                <input value={depForm.fullName} onChange={(e) => setDepForm((prev) => ({ ...prev, fullName: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border-light bg-white text-text-primary-light placeholder:text-text-muted-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light mb-1">Phone Number</p>
                <input value={depForm.phone} onChange={(e) => setDepForm((prev) => ({ ...prev, phone: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border-light bg-white text-text-primary-light placeholder:text-text-muted-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light mb-1">
                  Relationship
                </p>
                <select
                  value={depForm.relationship}
                  onChange={(e) =>
                    setDepForm((prev) => ({
                      ...prev,
                      relationship: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border-light bg-white text-text-primary-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="">Select relationship</option>
                  <option value="DAD">Dad</option>
                  <option value="MOM">Mom</option>
                  <option value="WIFE">Wife</option>
                </select>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light mb-1">Address</p>
                <input value={depForm.address} onChange={(e) => setDepForm((prev) => ({ ...prev, address: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-border-light bg-white text-text-primary-light placeholder:text-text-muted-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
              </div>
            </>
          ) : (
            <>
              <InfoRow label="Full Name" value={dep?.fullName || "—"} />
              <InfoRow label="Phone Number" value={dep?.phone || "—"} />
              <InfoRow label="Relationship" value={dep?.relationship || "—"} />
              <InfoRow label="Address" value={dep?.address || "—"} />
            </>
          )}
        </div>
      </SectionCard>
    </>
  );
};

export default GeneralTab;
