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
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    setErrors({});
    let newErrors: Record<string, string> = {};

    if (!newPassword) {
      newErrors.newPassword = "Password is required.";
    } else {
      if (newPassword.length < 6) {
        newErrors.newPassword = "Must be at least 6 characters.";
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        newErrors.newPassword = "Must contain at least 1 special character.";
      } else if (!/\d/.test(newPassword)) {
        newErrors.newPassword = "Must contain at least 1 number.";
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirmation is required.";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
    setErrors({});
    let newErrors: Record<string, string> = {};

    if (!contactName.trim()) {
      newErrors.contactName = "Contact name is required.";
    }
    if (!relationship.trim()) {
      newErrors.relationship = "Relationship is required.";
    }
    if (!contactPhone.trim()) {
      newErrors.contactPhone = "Phone number is required.";
    } else if (!/^(0|\+84)\d{8,9}$/.test(contactPhone.trim().replace(/\s+/g, ""))) {
      newErrors.contactPhone = "Invalid phone number format.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
    setErrors({});
    let newErrors: Record<string, string> = {};

    if (!accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required.";
    } else if (!/^\d+$/.test(accountNumber.trim())) {
      newErrors.accountNumber = "Account number must contain only digits.";
    }
    if (!bankName.trim()) {
      newErrors.bankName = "Bank name is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
    errors,
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
