import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  verifyToken,
  setPassword,
  submitEmergencyContact,
  submitBankAccount,
  type ActivationResponse,
} from "../../../services/activationService";

function resolveStep(currentStep: string | undefined): number {
  switch (currentStep) {
    case "PASSWORD_CREATED":
      return 2;
    case "COMPLETED":
      return 3;
    default:
      return 1;
  }
}

export const useActivation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<ActivationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Form states mapping
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [contactName, setContactName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No activation token found in the URL.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    verifyToken(token)
      .then((res) => {
        if (cancelled) return;
        setInfo(res);
        setStep(resolveStep(res.currentStep));
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Invalid or expired activation link.";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSetPassword = async () => {
    setError(null);
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await setPassword({ activationToken: token, newPassword });
      setInfo(res);
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to set password.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyContact = async () => {
    setError(null);
    if (!contactName.trim() || !relationship.trim() || !contactPhone.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await submitEmergencyContact(token, {
        contactName,
        relationship,
        phone: contactPhone,
        address: contactAddress || undefined,
      });
      setInfo(res);
      setStep(3);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to save emergency contact.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBankAccount = async () => {
    setError(null);
    if (!accountNumber.trim() || !bankName.trim()) {
      setError("Account number and bank name are required.");
      return;
    }
    setLoading(true);
    try {
      await submitBankAccount(token, {
        accountNumber,
        bankName,
        branchName: branchName || undefined,
        accountHolderName: accountHolderName || undefined,
      });
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save bank account.");
    } finally {
      setLoading(false);
    }
  };

  return {
    token,
    step,
    error,
    info,
    loading,
    done,
    handleSetPassword,
    handleEmergencyContact,
    handleBankAccount,

    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,

    contactName,
    setContactName,
    relationship,
    setRelationship,
    contactPhone,
    setContactPhone,
    contactAddress,
    setContactAddress,

    accountNumber,
    setAccountNumber,
    bankName,
    setBankName,
    branchName,
    setBranchName,
    accountHolderName,
    setAccountHolderName,
  };
};
