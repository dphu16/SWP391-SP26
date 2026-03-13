export type EmploymentType = "PROBATION" | "OFFICIAL";
export type RequestStatus = "SUBMITTED" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface JobRequest {
  id: string;
  posId: string;
  posName: string;
  deptId: string;
  deptName: string;
  quantity: number;
  location: string;
  type: EmploymentType;
  reportTo: string;
  reviewer: string;
  reason: string;
  status: RequestStatus;
  comment: string;
}

export interface JobRequestInput {
  posId: string;
  deptId: string;
  quantity: number;
  location: string;
  type: EmploymentType;
  reportTo: string;
  reason: string;
  status: RequestStatus;
  comment: string;
}

export type JobStatus = "OPEN" | "CLOSED" | "DRAFT" | "FILLED";

export interface Job {
  id: string;
  reqId: string;
  posId: string;
  deptId: string;
  deptName: string;
  posName: string;
  description: string;
  responsibility: string;
  requirement: string;
  benefit: string;
  quantity: number;
  status: JobStatus;
  closedTime: string; // OffsetDateTime -> string
  postedAt: string;
  hrId: string;
  hrName: string;
  maxCv: number;
  minSalary: number;
  maxSalary: number;
  type: EmploymentType;
  location: string;
}

export interface JobInput {
  requestId: string;
  posId: string;
  description: string;
  responsibility: string;
  requirement: string;
  benefit: string;
  quantity: number;
  status: string;
  closedTime: string;
  hrId: string;
  maxCv: number;
  type: EmploymentType;
  location: string;
  postedTime: string;
}
