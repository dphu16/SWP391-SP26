export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "OTHER";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface JobRequest {
    id: string;
    title: string;
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
    title: string;
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
    title: string;
    description: string;
    responsibility: string;
    requirement: string;
    benefit: string;
    quantity: number;
    status: JobStatus;
    closedTime: string; // OffsetDateTime -> string
    createAt: string;
    hrId: string;
}

export interface JobInput {
    requestId: string;
    title: string;
    description: string;
    responsibility: string;
    requirement: string;
    benefit: string;
    quantity: number;
    status: string;
    closedTime: string;
    hrId: string;
}
