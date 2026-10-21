"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  FileText,
  HelpCircle,
  KeyRound,
  Layers,
  Lock,
  MapPin,
  PackageCheck,
  RefreshCw,
  Save,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Upload,
  User,
  UserCheck,
  Video,
  X,
} from "lucide-react";
import { KycDocumentUpload } from "@/components/kyc/kyc-document-upload";
import {
  KYCDocumentItem,
  OnboardingApplication,
} from "@/lib/onboarding/types";
import { saveOnboardingApplication } from "@/lib/onboarding/mock-data";
import { UserSession } from "@/lib/auth";

interface RetailerOnboardingWizardProps {
  initiatorSession?: UserSession | null;
  onSuccess?: (application: OnboardingApplication) => void;
  onCancel?: () => void;
}

const steps = [
  { id: "A", title: "Personal & Contact", desc: "Identity & OTP Verification" },
  { id: "B", title: "Shop & Business", desc: "Store & Geo-Location" },
  { id: "C", title: "Identity KYC", desc: "PAN & Masked Aadhaar" },
  { id: "D", title: "Bank Account", desc: "Settlement Account Details" },
  { id: "E", title: "Photos & vKYC", desc: "Selfies, Sign & 30s Video" },
  { id: "F", title: "Parent & Services", desc: "Distributor & Device Kits" },
  { id: "G", title: "Review & Submit", desc: "Final Declarations & Filing" },
];

export function RetailerOnboardingWizard({
  initiatorSession,
  onSuccess,
  onCancel,
}: RetailerOnboardingWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [draftSavedMessage, setDraftSavedMessage] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<OnboardingApplication | null>(
    null
  );

  // Form State across Steps
  const [personal, setPersonal] = useState({
    fullName: "",
    rmn: "",
    alternateMobile: "",
    email: "",
    dob: "1992-06-15",
    photoUrl: "",
    mobileOtpVerified: false,
    emailOtpVerified: false,
  });

  const [business, setBusiness] = useState({
    businessName: "",
    shopName: "",
    category: "Grocery & Financial Services",
    businessType: "Sole Proprietorship" as const,
    shopAddress: "",
    country: "India",
    state: "Central State",
    city: "Metro City",
    district: "Zone-01",
    pinCode: "462001",
    landmark: "",
    geoCoords: "28.6139° N, 77.2090° E",
    msmeUdyamNumber: "",
  });

  const [identity, setIdentity] = useState({
    panNumber: "",
    panVerified: false,
    aadhaarNumber: "",
    aadhaarMasked: "",
    aadhaarVerified: false,
    addressProofType: "Electricity Bill" as const,
    consentTimestamp: new Date().toISOString(),
  });

  const [bank, setBank] = useState({
    accountHolderName: "",
    bankName: "State Bank of India",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    accountType: "Current" as const,
    branch: "",
    pennyDropVerified: false,
  });

  const [media, setMedia] = useState({
    merchantSelfieUploaded: false,
    employeeSelfieUploaded: false,
    shopFrontUploaded: false,
    signatureCaptured: false,
    vkycRecording: false,
    vkycDuration: 0,
    vkycDone: false,
  });

  const [hierarchy, setHierarchy] = useState({
    assignedSDId: initiatorSession?.assignedSD || "SD-CENTRAL-01",
    assignedSDName: "Central Spark FinTech Pvt Ltd (SD-CENTRAL-01)",
    assignedADId: initiatorSession?.orgScope || "AD-ZONE-01",
    assignedADName: initiatorSession?.name || "Sunil Verma (AD-ZONE-01)",
    agentRole: "Retailer",
    territory: initiatorSession?.territory || "Zone-01 Territory",
    eligibleServices: ["AEPS", "DMT", "BBPS", "MicroATM", "UPI Collect"],
    serviceAuthorized: true,
    kitRequested: true,
  });

  const [consentDeclaration, setConsentDeclaration] = useState(false);
  const [stepErrors, setStepErrors] = useState<string | null>(null);

  // Simulated OTP Triggers
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpInput, setMobileOtpInput] = useState("");

  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState("");

  // Simulated Penny Drop Verification
  const [verifyingBank, setVerifyingBank] = useState(false);

  // Document Uploads State for Step C & E
  const [documents, setDocuments] = useState<KYCDocumentItem[]>([
    {
      id: "DOC-PAN",
      type: "pan",
      label: "1. PAN Card Document",
      description: "Signed official PAN card copy",
      required: true,
      status: "Not Uploaded",
    },
    {
      id: "DOC-AADHAAR",
      type: "aadhaar",
      label: "2. Masked Aadhaar Card",
      description: "UIDAI Offline XML or Masked Aadhaar (Last 4 digits)",
      required: true,
      status: "Not Uploaded",
    },
    {
      id: "DOC-BANK",
      type: "bank_proof",
      label: "3. Cancelled Cheque / Bank Statement",
      description: "Showing printed name matching PAN",
      required: true,
      status: "Not Uploaded",
    },
    {
      id: "DOC-SHOP",
      type: "shop_photo",
      label: "4. Storefront Photograph",
      description: "Clear photograph of shop premises with sign board",
      required: true,
      status: "Not Uploaded",
    },
    {
      id: "DOC-JOINT",
      type: "employee_selfie",
      label: "5. Employee with Merchant Joint Photo",
      description: "PDF Page 3 Item 10: Field executive alongside merchant",
      required: true,
      status: "Not Uploaded",
    },
    {
      id: "DOC-SIGN",
      type: "signature",
      label: "6. Merchant Signature / Thumb Impression",
      description: "PDF Page 3 Item 12: Clear signature on white paper",
      required: true,
      status: "Not Uploaded",
    },
  ]);

  const updateDocItem = (updated: KYCDocumentItem) => {
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  // Step Validation before Next
  const validateCurrentStep = (): boolean => {
    setStepErrors(null);
    if (currentStepIndex === 0) {
      if (!personal.fullName.trim()) {
        setStepErrors("Please enter the applicant's full legal name.");
        return false;
      }
      if (personal.rmn.length < 10) {
        setStepErrors("Please provide a valid 10-digit mobile number.");
        return false;
      }
      if (!personal.mobileOtpVerified) {
        setStepErrors("Please verify mobile number via OTP before proceeding.");
        return false;
      }
      if (!personal.email.includes("@")) {
        setStepErrors("Please enter a valid official email address.");
        return false;
      }
    } else if (currentStepIndex === 1) {
      if (!business.shopName.trim()) {
        setStepErrors("Please enter the shop / storefront name.");
        return false;
      }
      if (!business.shopAddress.trim()) {
        setStepErrors("Please enter the physical shop address.");
        return false;
      }
      if (business.pinCode.length < 6) {
        setStepErrors("Please provide a valid 6-digit postal PIN code.");
        return false;
      }
    } else if (currentStepIndex === 2) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(identity.panNumber.toUpperCase())) {
        setStepErrors("Please enter a valid 10-character PAN number (e.g. ABCDE1234F).");
        return false;
      }
      const panDoc = documents.find((d) => d.type === "pan");
      if (!panDoc || panDoc.status === "Not Uploaded") {
        setStepErrors("Please upload a legible copy of the applicant PAN card.");
        return false;
      }
    } else if (currentStepIndex === 3) {
      if (!bank.accountHolderName.trim()) {
        setStepErrors("Please enter account holder name.");
        return false;
      }
      if (!bank.accountNumber || bank.accountNumber !== bank.confirmAccountNumber) {
        setStepErrors("Account number and confirmation account number do not match.");
        return false;
      }
      if (!bank.ifscCode.trim()) {
        setStepErrors("Please enter a valid 11-character bank IFSC code.");
        return false;
      }
    } else if (currentStepIndex === 4) {
      if (!media.vkycDone) {
        setStepErrors("Please record or upload the mandatory 30-second live Video KYC.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrev = () => {
    setStepErrors(null);
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSaveDraft = () => {
    const draftApp: OnboardingApplication = {
      id: `DRAFT-${Date.now().toString().slice(-6)}`,
      role: "Retailer",
      status: "Draft",
      applicantName: personal.fullName || "Draft Applicant",
      businessName: business.shopName || "Draft Store",
      rmn: personal.rmn || "9800000000",
      email: personal.email || "draft@buymecart.org",
      territory: hierarchy.territory,
      personal,
      business,
      identity: {
        ...identity,
        aadhaarMasked: identity.aadhaarNumber
          ? `•••• •••• ${identity.aadhaarNumber.slice(-4)}`
          : "•••• •••• 0000",
      },
      bank: {
        ...bank,
        accountNumberMasked: bank.accountNumber
          ? `•••• •••• ${bank.accountNumber.slice(-4)}`
          : "•••• •••• 0000",
        rawAccountNumber: bank.accountNumber,
      },
      media: {
        merchantSelfieUrl: "/docs/selfie.jpg",
        signatureUrl: "/docs/sign.png",
        vkycDurationSec: media.vkycDuration,
        vkycStatus: media.vkycDone ? "Recorded" : "Not Started",
      },
      hierarchy: {
        ...hierarchy,
        kitStatus: hierarchy.kitRequested ? "Pending Dispatch" : "Not Requested",
      },
      documents,
      reviewHistory: [
        {
          id: `REV-${Date.now()}`,
          actor: initiatorSession?.name || "AD Agent",
          actorRole: initiatorSession?.role || "Area Distributor",
          action: "Draft Saved",
          timestamp: new Date().toLocaleString(),
          remarks: "Draft saved locally by user.",
        },
      ],
      lastUpdatedAt: new Date().toLocaleString(),
    };

    saveOnboardingApplication(draftApp);
    setDraftSavedMessage(true);
    setTimeout(() => setDraftSavedMessage(false), 3000);
  };

  const handleSubmitApplication = () => {
    if (!consentDeclaration) {
      setStepErrors("You must accept the statutory KYC declarations and terms before submission.");
      return;
    }

    const newAppId = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalApp: OnboardingApplication = {
      id: newAppId,
      role: "Retailer",
      status: "Submitted",
      applicantName: personal.fullName,
      businessName: business.shopName,
      rmn: personal.rmn,
      email: personal.email,
      territory: hierarchy.territory,
      personal,
      business,
      identity: {
        ...identity,
        aadhaarMasked: `•••• •••• ${identity.aadhaarNumber.slice(-4) || "9012"}`,
      },
      bank: {
        ...bank,
        accountNumberMasked: `•••• •••• ${bank.accountNumber.slice(-4) || "4291"}`,
        rawAccountNumber: bank.accountNumber,
      },
      media: {
        merchantSelfieUrl: "/docs/selfie.jpg",
        signatureUrl: "/docs/signature.png",
        vkycDurationSec: 30,
        vkycStatus: "Recorded",
        vkycCodeRecited: "492-019",
      },
      hierarchy: {
        ...hierarchy,
        kitStatus: hierarchy.kitRequested ? "Pending Dispatch" : "Not Requested",
        kitSerialNumber: `KIT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      },
      documents,
      reviewHistory: [
        {
          id: `REV-${Date.now()}`,
          actor: initiatorSession?.name || "AD Sunil Verma",
          actorRole: initiatorSession?.role || "Area Distributor",
          action: "Submitted",
          timestamp: new Date().toLocaleString(),
          remarks: "Complete 12-point KYC and 30s vKYC filed for Admin compliance sign-off.",
        },
      ],
      submittedAt: new Date().toLocaleString(),
      lastUpdatedAt: new Date().toLocaleString(),
    };

    saveOnboardingApplication(finalApp);
    setSubmissionSuccess(finalApp);
    if (onSuccess) onSuccess(finalApp);
  };

  // Simulated OTP Handlers
  const handleSendMobileOtp = () => {
    if (personal.rmn.length < 10) return;
    setSendingMobileOtp(true);
    setTimeout(() => {
      setSendingMobileOtp(false);
      setMobileOtpSent(true);
    }, 600);
  };

  const handleVerifyMobileOtp = () => {
    if (mobileOtpInput.length >= 4) {
      setPersonal((prev) => ({ ...prev, mobileOtpVerified: true }));
      setMobileOtpSent(false);
    }
  };

  const handleSendEmailOtp = () => {
    if (!personal.email.includes("@")) return;
    setSendingEmailOtp(true);
    setTimeout(() => {
      setSendingEmailOtp(false);
      setEmailOtpSent(true);
    }, 600);
  };

  const handleVerifyEmailOtp = () => {
    if (emailOtpInput.length >= 4) {
      setPersonal((prev) => ({ ...prev, emailOtpVerified: true }));
      setEmailOtpSent(false);
    }
  };

  // Simulated Penny Drop Handler
  const handleVerifyBankPennyDrop = () => {
    setVerifyingBank(true);
    setTimeout(() => {
      setVerifyingBank(false);
      setBank((prev) => ({ ...prev, pennyDropVerified: true }));
    }, 1000);
  };

  // Simulated vKYC 30s Recording
  const handleStartVkycRecording = () => {
    setMedia((prev) => ({ ...prev, vkycRecording: true }));
    let sec = 0;
    const interval = setInterval(() => {
      sec += 5;
      setMedia((prev) => ({ ...prev, vkycDuration: sec }));
      if (sec >= 30) {
        clearInterval(interval);
        setMedia((prev) => ({
          ...prev,
          vkycRecording: false,
          vkycDone: true,
          vkycDuration: 30,
        }));
      }
    }, 400);
  };

  // Final Success Screen
  if (submissionSuccess) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center max-w-xl mx-auto shadow-xl space-y-4">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 size={36} />
        </div>

        <div>
          <span className="rounded bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wide">
            Application Filed Successfully
          </span>
          <h2 className="mt-3 text-xl font-black text-[#101C32]">
            Retailer Onboarding Application Submitted
          </h2>
          <p className="mt-1 font-mono text-sm font-bold text-[#16B8A6]">
            Reference ID: {submissionSuccess.id}
          </p>
          <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
            The application has been routed to the Admin Compliance Review Queue. In accordance with Maker-Checker policy, account activation requires Root Admin compliance approval.
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 text-xs text-left space-y-1.5 font-mono text-[#64748B]">
          <p>Merchant: <strong className="text-[#101C32]">{submissionSuccess.applicantName}</strong></p>
          <p>Store: <strong className="text-[#101C32]">{submissionSuccess.businessName}</strong></p>
          <p>Assigned AD: <strong className="text-[#101C32]">{submissionSuccess.hierarchy.assignedADName}</strong></p>
          <p>Territory: <strong className="text-[#101C32]">{submissionSuccess.territory}</strong></p>
          <p>Status: <span className="font-bold text-amber-700">Submitted (Pending Review)</span></p>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => {
              setSubmissionSuccess(null);
              setCurrentStepIndex(0);
            }}
            className="rounded-xl bg-[#101C32] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#1a2d52] transition"
          >
            Onboard Another Merchant
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-xs font-semibold text-[#64748B] hover:bg-[#F5F7FA] transition"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
      {/* Top Wizard Header */}
      <div className="border-b border-[#E2E8F0] bg-[#101C32] p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#16B8A6] px-2 py-0.5 text-[10px] font-black text-[#101C32] uppercase">
                12-Point KYC Wizard
              </span>
              <span className="text-xs text-slate-300">
                Buymecart Platform Merchant Onboarding
              </span>
            </div>
            <h2 className="mt-1 text-lg font-black tracking-tight text-white">
              Retailer / Merchant Onboarding Dossier
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              <Save size={13} /> Save Draft
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {draftSavedMessage && (
          <div className="mt-3 rounded-lg bg-[#16B8A6]/20 border border-[#16B8A6] px-3 py-1.5 text-xs text-[#16B8A6] font-semibold flex items-center gap-2">
            <CheckCircle2 size={14} /> Draft successfully saved to local compliance repository.
          </div>
        )}

        {/* Multi-Step Progress Indicator */}
        <div className="mt-6 hidden md:grid grid-cols-7 gap-2">
          {steps.map((st, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div key={st.id} className="space-y-1">
                <div
                  className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                    isCompleted
                      ? "bg-[#16B8A6]"
                      : isCurrent
                      ? "bg-[#16B8A6] ring-2 ring-[#16B8A6]/50"
                      : "bg-white/20"
                  }`}
                />
                <p
                  className={`text-[10px] font-bold truncate ${
                    isCurrent ? "text-[#16B8A6]" : isCompleted ? "text-slate-200" : "text-slate-400"
                  }`}
                >
                  {st.id}. {st.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mobile Compact Progress Bar */}
        <div className="mt-4 md:hidden">
          <div className="flex justify-between text-xs text-slate-300 mb-1 font-medium">
            <span>
              Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex].title}
            </span>
            <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#16B8A6] transition-all"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Validation Alert */}
      {stepErrors && (
        <div className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center gap-2 font-medium">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{stepErrors}</span>
        </div>
      )}

      {/* Form Workspace Content */}
      <div className="p-6">
        {/* ========================================================== */}
        {/* STEP A: PERSONAL & CONTACT INFORMATION                     */}
        {/* ========================================================== */}
        {currentStepIndex === 0 && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <h3 className="text-sm font-bold text-[#101C32]">
                Step A: Personal & Contact Information
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Enter legal representative details. Registered mobile number (RMN) is the primary authentication identifier.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Full Legal Name (as per PAN) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar Sharma"
                  value={personal.fullName}
                  onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={personal.dob}
                  onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              {/* RMN with OTP Verification */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Registered Mobile Number (RMN) <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit primary mobile"
                    value={personal.rmn}
                    onChange={(e) => setPersonal({ ...personal, rmn: e.target.value })}
                    className="flex-1 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                  />
                  {!personal.mobileOtpVerified ? (
                    <button
                      type="button"
                      onClick={handleSendMobileOtp}
                      disabled={personal.rmn.length < 10 || sendingMobileOtp}
                      className="rounded-xl bg-[#101C32] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#1a2d52] disabled:opacity-40 transition"
                    >
                      {sendingMobileOtp ? "Sending..." : "Send OTP"}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={14} /> Verified
                    </span>
                  )}
                </div>

                {mobileOtpSent && !personal.mobileOtpVerified && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter 4-digit OTP"
                      value={mobileOtpInput}
                      onChange={(e) => setMobileOtpInput(e.target.value)}
                      className="w-32 rounded-xl border border-[#16B8A6] bg-white px-3 py-1.5 text-xs text-[#101C32] outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyMobileOtp}
                      className="rounded-xl bg-[#16B8A6] px-3 py-1.5 text-xs font-bold text-[#101C32] hover:bg-[#14a090] transition"
                    >
                      Verify OTP
                    </button>
                  </div>
                )}
              </div>

              {/* Alternate Mobile */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Alternate Contact Number (Optional)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Alternate phone"
                  value={personal.alternateMobile}
                  onChange={(e) => setPersonal({ ...personal, alternateMobile: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              {/* Email with OTP Verification */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="merchant@domain.com"
                    value={personal.email}
                    onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                    className="flex-1 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                  />
                  {!personal.emailOtpVerified ? (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={!personal.email.includes("@") || sendingEmailOtp}
                      className="rounded-xl bg-[#101C32] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#1a2d52] disabled:opacity-40 transition"
                    >
                      {sendingEmailOtp ? "Sending..." : "Verify Email"}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={14} /> Verified
                    </span>
                  )}
                </div>

                {emailOtpSent && !personal.emailOtpVerified && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Email OTP"
                      value={emailOtpInput}
                      onChange={(e) => setEmailOtpInput(e.target.value)}
                      className="w-32 rounded-xl border border-[#16B8A6] bg-white px-3 py-1.5 text-xs text-[#101C32] outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmailOtp}
                      className="rounded-xl bg-[#16B8A6] px-3 py-1.5 text-xs font-bold text-[#101C32] hover:bg-[#14a090] transition"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP B: SHOP & BUSINESS INFORMATION                        */}
        {/* ========================================================== */}
        {currentStepIndex === 1 && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <h3 className="text-sm font-bold text-[#101C32]">
                Step B: Shop & Storefront Information
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Physical retail location and business classification per PDF Page 3 12-point KYC requirements.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Shop / Storefront Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharma Digital Services"
                  value={business.shopName}
                  onChange={(e) => setBusiness({ ...business, shopName: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Business Entity Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={business.businessType}
                  onChange={(e) =>
                    setBusiness({
                      ...business,
                      businessType: e.target.value as typeof business.businessType,
                    })
                  }
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                >
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership">Partnership Firm</option>
                  <option value="Private Limited">Private Limited Company</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                  <option value="Individual">Individual Merchant</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Complete Physical Store Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Shop number, street, ward, commercial market..."
                  value={business.shopAddress}
                  onChange={(e) => setBusiness({ ...business, shopAddress: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-3 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  State / Circle <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={business.state}
                  onChange={(e) => setBusiness({ ...business, state: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  City / Town <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={business.city}
                  onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Postal PIN Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6-digit PIN"
                  value={business.pinCode}
                  onChange={(e) => setBusiness({ ...business, pinCode: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  MSME Udyam Registration (Optional)
                </label>
                <input
                  type="text"
                  placeholder="UDYAM-XX-00-000000"
                  value={business.msmeUdyamNumber}
                  onChange={(e) => setBusiness({ ...business, msmeUdyamNumber: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  GPS Geo-Location Coordinates (PDF Page 2 Item 4)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={business.geoCoords}
                    className="flex-1 rounded-xl border border-[#E2E8F0] bg-slate-100 px-3.5 py-2 text-xs text-[#64748B] font-mono outline-none cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setBusiness((prev) => ({
                        ...prev,
                        geoCoords: "28.6139° N, 77.2090° E (Acquired)",
                      }))
                    }
                    className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-bold text-[#101C32] hover:bg-[#F5F7FA] transition"
                  >
                    Refresh GPS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP C: IDENTITY & ADDRESS KYC                             */}
        {/* ========================================================== */}
        {currentStepIndex === 2 && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <h3 className="text-sm font-bold text-[#101C32]">
                Step C: Statutory Identity & Address KYC
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                PAN and Aadhaar collection conforming to NPCI, RBI, and PMLA regulatory guidelines.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Permanent Account Number (PAN) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={identity.panNumber}
                  onChange={(e) =>
                    setIdentity({ ...identity, panNumber: e.target.value.toUpperCase() })
                  }
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] font-mono uppercase outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Aadhaar Number (Last 4 Digits Masked) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  placeholder="12-digit Aadhaar"
                  value={identity.aadhaarNumber}
                  onChange={(e) =>
                    setIdentity({ ...identity, aadhaarNumber: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] font-mono outline-none focus:border-[#16B8A6] focus:bg-white"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  Raw Aadhaar numbers are never permanently stored; masked as •••• •••• {identity.aadhaarNumber.slice(-4) || "XXXX"}.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Mandatory Identification Documents
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {documents
                  .filter((d) => d.type === "pan" || d.type === "aadhaar")
                  .map((doc) => (
                    <KycDocumentUpload key={doc.id} document={doc} onChange={updateDocItem} />
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP D: BANK ACCOUNT DETAILS                               */}
        {/* ========================================================== */}
        {currentStepIndex === 3 && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <h3 className="text-sm font-bold text-[#101C32]">
                Step D: Settlement Bank Account
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Bank account for daily wallet settlement, AEPS cash-out, and commission payouts.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Account Beneficiary Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Name as registered with bank"
                  value={bank.accountHolderName}
                  onChange={(e) => setBank({ ...bank, accountHolderName: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Bank Name <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bank.bankName}
                  onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] outline-none focus:border-[#16B8A6] focus:bg-white"
                >
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Punjab National Bank">Punjab National Bank</option>
                  <option value="Bank of Baroda">Bank of Baroda</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Fino Payments Bank">Fino Payments Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter account number"
                  value={bank.accountNumber}
                  onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] font-mono outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Confirm Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Re-enter account number"
                  value={bank.confirmAccountNumber}
                  onChange={(e) => setBank({ ...bank, confirmAccountNumber: e.target.value })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] font-mono outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Bank IFSC Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  placeholder="e.g. SBIN0001234"
                  value={bank.ifscCode}
                  onChange={(e) => setBank({ ...bank, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] font-mono uppercase outline-none focus:border-[#16B8A6] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#64748B] mb-1">
                  Penny-Drop Verification
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyBankPennyDrop}
                    disabled={verifyingBank || bank.pennyDropVerified || !bank.ifscCode}
                    className="flex-1 rounded-xl bg-[#101C32] px-3 py-2 text-xs font-bold text-white hover:bg-[#1a2d52] disabled:opacity-40 transition"
                  >
                    {verifyingBank
                      ? "Verifying Penny-Drop..."
                      : bank.pennyDropVerified
                      ? "Verified ✓ Penny Deposited"
                      : "Test Penny-Drop Verification"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              {documents
                .filter((d) => d.type === "bank_proof")
                .map((doc) => (
                  <KycDocumentUpload key={doc.id} document={doc} onChange={updateDocItem} />
                ))}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP E: PHOTOGRAPHS & 30s VIDEO KYC                        */}
        {/* ========================================================== */}
        {currentStepIndex === 4 && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <h3 className="text-sm font-bold text-[#101C32]">
                Step E: Photographs & 30-Second Video KYC
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Per PDF Page 3 Items 8, 9, 10, 11, 12: Merchant selfie, field executive joint selfie, storefront photo, and 30-second live recording.
              </p>
            </div>

            {/* Document upload cards for photos and signature */}
            <div className="grid gap-3 sm:grid-cols-2">
              {documents
                .filter(
                  (d) =>
                    d.type === "shop_photo" ||
                    d.type === "employee_selfie" ||
                    d.type === "signature"
                )
                .map((doc) => (
                  <KycDocumentUpload key={doc.id} document={doc} onChange={updateDocItem} />
                ))}
            </div>

            {/* 30-Second Video KYC Recorder Card */}
            <div className="rounded-2xl border border-dashed border-[#16B8A6] bg-[#F5F7FA] p-6 text-center space-y-3">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#101C32] text-[#16B8A6]">
                <Video size={24} />
              </div>

              <div>
                <p className="text-xs font-bold text-[#101C32]">
                  30-Second Live Video KYC Recording
                </p>
                <p className="text-[11px] text-[#64748B] mt-1 max-w-md mx-auto">
                  Merchant must hold original PAN card and recite:
                  <strong className="block text-[#101C32] mt-0.5">
                    "I am {personal.fullName || "Applicant"}, {business.shopName || "Store"}, reciting verification code 492-019"
                  </strong>
                </p>
              </div>

              {media.vkycRecording ? (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-rose-600 font-bold text-xs">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-ping" />
                    <span>Recording in progress: {media.vkycDuration} / 30 seconds</span>
                  </div>
                  <div className="h-1.5 w-48 bg-rose-200 rounded-full mx-auto overflow-hidden">
                    <div
                      className="h-full bg-rose-600 transition-all duration-300"
                      style={{ width: `${(media.vkycDuration / 30) * 100}%` }}
                    />
                  </div>
                </div>
              ) : media.vkycDone ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> 30-Second vKYC Recording Successfully Captured & Hashed
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartVkycRecording}
                  className="rounded-xl bg-[#16B8A6] px-5 py-2.5 text-xs font-bold text-[#101C32] hover:bg-[#14a090] transition shadow-xs"
                >
                  Start 30-Second Live vKYC Recording
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP F: PARENT DISTRIBUTOR & SERVICE CONFIGURATION         */}
        {/* ========================================================== */}
        {currentStepIndex === 5 && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <h3 className="text-sm font-bold text-[#101C32]">
                Step F: Parent Assignment & Hardware Starter Kit
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Hierarchical parent linkage and service permissions.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 text-xs space-y-2">
              <p className="font-bold text-[#101C32]">Hierarchical Linkage (Restricted):</p>
              <div className="grid sm:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-[#64748B]">Assigned Area Distributor:</span>
                  <p className="font-bold text-[#101C32]">{hierarchy.assignedADName}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Assigned Super Distributor:</span>
                  <p className="font-bold text-[#101C32]">{hierarchy.assignedSDName}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Operating Territory:</span>
                  <p className="font-bold text-[#101C32]">{hierarchy.territory}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Merchant Role:</span>
                  <p className="font-bold text-[#16B8A6]">Retailer (Zero Downstream Rights)</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-3">
              <p className="font-bold text-[#101C32] text-xs">Eligible Payment Rail Services:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  "AEPS Cash Withdrawal",
                  "DMT Remittance",
                  "BBPS Utility Payments",
                  "MicroATM Terminal",
                  "UPI Collect / Dynamic QR",
                  "Mobile & DTH Recharge",
                ].map((srv) => (
                  <div
                    key={srv}
                    className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] p-2 text-xs"
                  >
                    <CheckCircle2 size={13} className="text-[#16B8A6]" />
                    <span className="text-[#101C32] font-medium">{srv}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#64748B]">
                *Services are subject to Root Admin compliance authorization upon application review.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#101C32]">Request Retailer Starter Kit</p>
                <p className="text-[11px] text-[#64748B]">
                  Includes physical QR Standee, MicroATM terminal, and Biometric Scanner.
                </p>
              </div>
              <input
                type="checkbox"
                checked={hierarchy.kitRequested}
                onChange={(e) => setHierarchy({ ...hierarchy, kitRequested: e.target.checked })}
                className="h-4 w-4 rounded border-[#E2E8F0] text-[#16B8A6] focus:ring-[#16B8A6]"
              />
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP G: REVIEW BEFORE SUBMISSION                           */}
        {/* ========================================================== */}
        {currentStepIndex === 6 && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <h3 className="text-sm font-bold text-[#101C32]">
                Step G: Review Before Final Submission
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Verify application details before submitting for Admin compliance approval.
              </p>
            </div>

            {/* Application Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 space-y-1.5">
                <p className="font-bold text-[#101C32] border-b border-[#E2E8F0] pb-1">
                  1. Applicant Details
                </p>
                <p>Name: <strong className="text-[#101C32]">{personal.fullName || "—"}</strong></p>
                <p>RMN: <strong className="text-[#101C32]">{personal.rmn || "—"}</strong></p>
                <p>Email: <strong className="text-[#101C32]">{personal.email || "—"}</strong></p>
                <p>DOB: <strong className="text-[#101C32]">{personal.dob}</strong></p>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 space-y-1.5">
                <p className="font-bold text-[#101C32] border-b border-[#E2E8F0] pb-1">
                  2. Storefront Details
                </p>
                <p>Store: <strong className="text-[#101C32]">{business.shopName || "—"}</strong></p>
                <p>Type: <strong className="text-[#101C32]">{business.businessType}</strong></p>
                <p>Address: <strong className="text-[#101C32]">{business.shopAddress || "—"}</strong></p>
                <p>PIN: <strong className="text-[#101C32]">{business.pinCode}</strong></p>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 space-y-1.5">
                <p className="font-bold text-[#101C32] border-b border-[#E2E8F0] pb-1">
                  3. Identity & Banking
                </p>
                <p>PAN: <strong className="text-[#101C32] font-mono">{identity.panNumber || "—"}</strong></p>
                <p>Aadhaar: <strong className="text-[#101C32] font-mono">•••• •••• {identity.aadhaarNumber.slice(-4) || "XXXX"}</strong></p>
                <p>Bank: <strong className="text-[#101C32]">{bank.bankName}</strong></p>
                <p>Account: <strong className="text-[#101C32] font-mono">•••• •••• {bank.accountNumber.slice(-4) || "XXXX"}</strong></p>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 space-y-1.5">
                <p className="font-bold text-[#101C32] border-b border-[#E2E8F0] pb-1">
                  4. Hierarchy & vKYC
                </p>
                <p>Parent AD: <strong className="text-[#101C32]">{hierarchy.assignedADName}</strong></p>
                <p>Territory: <strong className="text-[#101C32]">{hierarchy.territory}</strong></p>
                <p>vKYC: <span className="font-bold text-emerald-700">{media.vkycDone ? "Completed (30s) ✓" : "Pending"}</span></p>
                <p>Hardware Kit: <strong className="text-[#101C32]">{hierarchy.kitRequested ? "Requested" : "No"}</strong></p>
              </div>
            </div>

            {/* Declarations & Consent */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] p-4 flex items-start gap-3">
              <input
                type="checkbox"
                id="consent"
                checked={consentDeclaration}
                onChange={(e) => setConsentDeclaration(e.target.checked)}
                className="h-4 w-4 rounded border-[#E2E8F0] text-[#16B8A6] focus:ring-[#16B8A6] mt-0.5"
              />
              <label htmlFor="consent" className="text-xs text-[#101C32] leading-relaxed">
                <strong>Statutory Declaration & Compliance Consent:</strong> I hereby declare that all information, identity documents, and video recordings submitted are authentic and correspond to the applicant merchant. I understand that fraudulent submissions constitute grounds for immediate deactivation and regulatory escalation under PMLA & RBI guidelines.
              </label>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="mt-8 flex items-center justify-between border-t border-[#E2E8F0] pt-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F5F7FA] disabled:opacity-30 transition"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex items-center gap-3">
            {currentStepIndex < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#101C32] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1a2d52] transition"
              >
                Continue to Step {currentStepIndex + 2} <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitApplication}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#16B8A6] px-6 py-2.5 text-xs font-black text-[#101C32] shadow-sm hover:bg-[#14a090] transition"
              >
                <Send size={14} /> Submit Application for Compliance Approval
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
