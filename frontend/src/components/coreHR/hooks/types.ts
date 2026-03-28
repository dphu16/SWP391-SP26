export enum EmployeeStatus {
  Active = "Active",
  OnBoarding = "On Boarding",
  Probation = "Probation",
  OnLeave = "On Leave",
}

export interface Employee {
  id: string;
  employeeCode: string;
  avatarUrl: string;
  fullName: string;
  phone: string;
  positionTitle: string;
  roles: string[];
  deptName: string;
  statusEmp: string;
}

// Spring Boot 3.x Page<T> response wrapper
export interface PageResponse<T> {
  content: T[];
  page: {
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

export interface NavItem {
  label: string;
  icon: string;
  active?: boolean;
  hasSubmenu?: boolean;
  expanded?: boolean;
  subItems?: string[];
}

// Application (hired candidates for onboarding)
export interface Application {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  jobId: string;
  jobTitle: string;
  cvUrl: string;
  status: string;
  onboardingStatus: string;
  progressStatus: string | null;
  rejectionReason: string | null;
  score: number | null;
  createdAt: string;
}

// New API response: GET /api/applications/hired
export interface OnboardingListResponse {
  hiredApplications: Application[];
  onboardingEmployees: Application[];
}

// DTO để tạo nhân viên mới (POST /api/employees/new)
export interface CreateNewHireDTO {
  fullName: string;
  phone: string;
  email: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  address: string;
  departmentId: string;
  positionId: string;
  citizenId: string;
  taxCode: string;
  dateOfBirth: string;
  avatarUrl?: string;
  sourceApplicationId?: string | null;
  managerId?: string;
  dateOfJoining?: string;
  role: string;
  status: string;
  contractNumber?: string;
  startDate?: string;
  contractDuration?: string;
  endDate?: string;
  baseSalary: number;
}

// Offboarding employee DTO (TERMINATED / RESIGNED employees)
export interface OffboardingEmployee {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  departmentName: string;
  positionTitle: string;
  employeeStatus: "TERMINATED" | "RESIGNED" | string;
  dateOfJoining: string;
}

// Offboarding request response from API
export interface OffboardingRequest {
  offboardingId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  positionTitle: string;
  avatarUrl?: string;
  type: "RESIGNATION" | "TERMINATED" | "CONTRACT_EXPIRED";
  status: "PENDING" | "MANAGER_APPROVED" | "HR_CONFIRMED" | "CANCELLED" | "COMPLETED";
  reason: string;
  requestDate: string;
  expectedLastDay?: string;
  officialLastDay?: string;
  requestedBy?: string;
  requestedByName?: string;
  approvedByManager?: string;
  approvedByManagerName?: string;
  managerApprovedDate?: string;
  confirmedByHr?: string;
  confirmedByHrName?: string;
  hrConfirmedDate?: string;
  cancelReason?: string;
  cancelledBy?: string;
  cancelledByName?: string;
  cancelledDate?: string;
}