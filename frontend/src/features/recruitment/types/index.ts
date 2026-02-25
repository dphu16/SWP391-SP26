export type JobRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface JobRequest {
    id: string;
    title: string;
    deptId: string;
    deptName: string;
    quantity: number;
    location: string;
    type: string; // EmploymentType enum
    reportTo: string;
    reviewer: string;
    reason: string;
    status: JobRequestStatus;
    comment: string;
}

export interface JobRequestInput {
    jobTitle: string;
    deptId: string;
    quantity: number;
    location: string;
    employmentType: string;
    reportsTo: string;
    reason: string;
    status?: string;
    hrComment?: string;
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
