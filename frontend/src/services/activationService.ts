import apiClient from "./apiClient";

export interface ActivationResponse {
  message: string;
  employeeName: string;
  email: string;
  employeeId: string;
  currentStep: string;
}

export interface SetPasswordPayload {
  activationToken: string;
  newPassword: string;
}

export interface EmergencyContactPayload {
  contactName: string;
  relationship: string;
  phone: string;
  address?: string;
}

export interface BankAccountPayload {
  accountNumber: string;
  bankName: string;
  branchName?: string;
  accountHolderName?: string;
}

export async function verifyToken(token: string): Promise<ActivationResponse> {
  const res = await apiClient.get<ActivationResponse>(
    "/api/activation/verify",
    {
      params: { token },
    },
  );
  return res.data;
}

export async function setPassword(
  payload: SetPasswordPayload,
): Promise<ActivationResponse> {
  const res = await apiClient.post<ActivationResponse>(
    "/api/activation/set-password",
    payload,
  );
  return res.data;
}

export async function submitEmergencyContact(
  token: string,
  payload: EmergencyContactPayload,
): Promise<ActivationResponse> {
  const res = await apiClient.post<ActivationResponse>(
    "/api/activation/emergency-contact",
    payload,
    { params: { token } },
  );
  return res.data;
}

export async function submitBankAccount(
  token: string,
  payload: BankAccountPayload,
): Promise<ActivationResponse> {
  const res = await apiClient.post<ActivationResponse>(
    "/api/activation/bank-account",
    payload,
    { params: { token } },
  );
  return res.data;
}
