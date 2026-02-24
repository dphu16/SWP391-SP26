export enum EmployeeStatus {
  Active = "Active",
  OnBoarding = "On Boarding",
  Probation = "Probation",
  OnLeave = "On Leave",
}

export type RequestType =
  | "CHANGE_OF_INFORMATION"
  | "CHANGE_OF_POSITION";




export interface Employee {
  id: string;
  employeeCode: string;
  avatarUrl: string;
  fullName: string;
  phone: string;
  positionTitle: string;
  role: string;
  deptName: string;
  statusRole: string;
}

// Spring Boot Page<T> response wrapper
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
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
  onboardingStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
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
  /** UUID của Application trong module tuyển dụng. Nếu có, backend sẽ xóa khỏi danh sách onboarding sau khi tạo nhân viên thành công. */
  sourceApplicationId?: string;
  /** UUID của manager trực tiếp */
  managerId?: string;
  /** Tên người thân */
  dependentName?: string;
  /** Quan hệ với người thân */
  relationship?: string;
  /** Mức lương tối thiểu */
  baseSalaryMin: string;
  /** Mức lương tối đa */
  baseSalaryMax: string;
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
