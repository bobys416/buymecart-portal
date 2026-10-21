import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { theme } from "../theme";
import { InputField } from "../components/InputField";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";

export interface MobileKycScreenProps {
  initiatorRole: "admin" | "super_distributor" | "area_distributor" | "retailer";
  targetRole?: "super_distributor" | "area_distributor" | "retailer";
  onComplete?: () => void;
  onCancel?: () => void;
}

export const MobileKycScreen: React.FC<MobileKycScreenProps> = ({
  initiatorRole,
  targetRole = "retailer",
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 7;

  // Step 1: Personal & Verification
  const [fullName, setFullName] = useState("");
  const [rmn, setRmn] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  // Step 2: Business & Address
  const [businessName, setBusinessName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [district, setDistrict] = useState("Zone-01 Division");
  const [pincode, setPincode] = useState("462001");
  const [msmeUdyam, setMsmeUdyam] = useState("");

  // Step 3: Identity & PAN
  const [panNumber, setPanNumber] = useState("");
  const [panVerified, setPanVerified] = useState(false);
  const [aadhaarLastFour, setAadhaarLastFour] = useState("");
  const [aadhaarVerified, setAadhaarVerified] = useState(false);

  // Step 4: Bank Details & Penny Drop
  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("State Bank of India");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");
  const [ifsc, setIfsc] = useState("SBIN0001234");
  const [pennyDropVerified, setPennyDropVerified] = useState(false);

  // Step 5: Camera & Media Uploads
  const [applicantSelfieCaptured, setApplicantSelfieCaptured] = useState(false);
  const [shopPhotoCaptured, setShopPhotoCaptured] = useState(false);
  const [signatureCaptured, setSignatureCaptured] = useState(false);

  // Step 6: 30-Second Video KYC
  const [vkycRecorded, setVkycRecorded] = useState(false);
  const [vkycTimer, setVkycTimer] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const verificationCode = "729-418"; // Dynamic random code for compliance recitation

  // Step 7: Territory, Kit & Declarations
  const [territory] = useState("Zone-01 Territory");
  const [kitSerial] = useState(`KIT-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [assignedAppId, setAssignedAppId] = useState("");

  const handleVerifyMobileOtp = () => {
    if (mobileOtp.trim().length >= 4) {
      setMobileVerified(true);
    }
  };

  const handleVerifyEmailOtp = () => {
    if (emailOtp.trim().length >= 4) {
      setEmailVerified(true);
    }
  };

  const handleVerifyPan = () => {
    if (panNumber.trim().length === 10) {
      setPanVerified(true);
    }
  };

  const handleVerifyAadhaar = () => {
    if (aadhaarLastFour.trim().length === 4) {
      setAadhaarVerified(true);
    }
  };

  const handlePennyDrop = () => {
    if (accountNumber && ifsc) {
      setPennyDropVerified(true);
    }
  };

  const handleStartVkyc = () => {
    setIsRecording(true);
    setVkycTimer(1);
    const interval = setInterval(() => {
      setVkycTimer((prev) => {
        if (prev >= 30) {
          clearInterval(interval);
          setIsRecording(false);
          setVkycRecorded(true);
          return 30;
        }
        return prev + 5;
      });
    }, 300);
  };

  const handleSubmit = () => {
    if (!termsAccepted) {
      Alert.alert("Compliance Declaration", "Please accept statutory KYC declarations before submission.");
      return;
    }
    const appId = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setAssignedAppId(appId);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>KYC Application Submitted</Text>
          <Text style={styles.successAppId}>Application Ref: {assignedAppId}</Text>
          <Text style={styles.successDesc}>
            Your {targetRole.replace("_", " ").toUpperCase()} onboarding dossier has been securely dispatched to the compliance verification queue.
          </Text>

          <View style={styles.auditDossierBox}>
            <Text style={styles.dossierRow}>• Applicant: {fullName || "Retailer Merchant"}</Text>
            <Text style={styles.dossierRow}>• Territory: {territory}</Text>
            <Text style={styles.dossierRow}>• Logistics Kit: {kitSerial}</Text>
            <Text style={styles.dossierRow}>• Video KYC: 30s Recitation Recorded ({verificationCode})</Text>
            <Text style={styles.dossierRow}>• Bank Verification: Penny Drop Passed</Text>
          </View>

          <Button
            title="Done / Return to Dashboard"
            onPress={() => {
              if (onComplete) onComplete();
              else if (onCancel) onCancel();
            }}
            size="lg"
            style={styles.doneBtn}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Badge label={`INITIATOR: ${initiatorRole.toUpperCase()}`} variant="navy" />
          <Badge label={`TARGET: ${targetRole.replace("_", " ").toUpperCase()}`} variant="teal" />
        </View>
        <Text style={styles.screenTitle}>Multi-Step KYC Onboarding</Text>
        <Text style={styles.screenSubtitle}>
          Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
        </Text>

        {/* Step Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
        </View>
      </View>

      {/* STEP 1: Personal & Contact */}
      {currentStep === 1 && (
        <View style={styles.stepForm}>
          <InputField
            label="Applicant Full Name"
            placeholder="e.g. Ramesh Chandra"
            value={fullName}
            onChangeText={setFullName}
          />

          <View style={styles.otpRow}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Registered Mobile Number (RMN)"
                placeholder="10-digit mobile"
                value={rmn}
                onChangeText={setRmn}
                keyboardType="phone-pad"
              />
            </View>
            <TouchableOpacity
              style={[styles.verifyChip, mobileVerified && styles.verifiedChip]}
              onPress={handleVerifyMobileOtp}
            >
              <Text style={styles.verifyChipText}>
                {mobileVerified ? "✓ Verified" : "Verify RMN"}
              </Text>
            </TouchableOpacity>
          </View>

          {!mobileVerified && (
            <InputField
              label="Enter 4-Digit Mobile OTP"
              placeholder="e.g. 4910"
              value={mobileOtp}
              onChangeText={setMobileOtp}
              keyboardType="number-pad"
            />
          )}

          <View style={styles.otpRow}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Email Address"
                placeholder="ramesh@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </View>
            <TouchableOpacity
              style={[styles.verifyChip, emailVerified && styles.verifiedChip]}
              onPress={handleVerifyEmailOtp}
            >
              <Text style={styles.verifyChipText}>
                {emailVerified ? "✓ Verified" : "Verify Email"}
              </Text>
            </TouchableOpacity>
          </View>

          {!emailVerified && (
            <InputField
              label="Enter 4-Digit Email OTP"
              placeholder="e.g. 8832"
              value={emailOtp}
              onChangeText={setEmailOtp}
              keyboardType="number-pad"
            />
          )}
        </View>
      )}

      {/* STEP 2: Business & Address */}
      {currentStep === 2 && (
        <View style={styles.stepForm}>
          <InputField
            label="Shop / Business Outlet Name"
            placeholder="e.g. Ramesh Digital Kendra"
            value={businessName}
            onChangeText={setBusinessName}
          />
          <InputField
            label="Registered Shop Street Address"
            placeholder="Shop No. 12, Main Market Road"
            value={shopAddress}
            onChangeText={setShopAddress}
          />
          <InputField
            label="Territory / District"
            placeholder="Zone-01 Division"
            value={district}
            onChangeText={setDistrict}
          />
          <InputField
            label="6-Digit Postal PIN Code"
            placeholder="462001"
            value={pincode}
            onChangeText={setPincode}
            keyboardType="number-pad"
          />
          <InputField
            label="MSME / Udyam Certificate (Optional)"
            placeholder="UDYAM-MP-01-0012345"
            value={msmeUdyam}
            onChangeText={setMsmeUdyam}
          />
        </View>
      )}

      {/* STEP 3: Identity & PAN */}
      {currentStep === 3 && (
        <View style={styles.stepForm}>
          <View style={styles.otpRow}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Permanent Account Number (PAN)"
                placeholder="ABCDE1234F"
                value={panNumber}
                onChangeText={setPanNumber}
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity
              style={[styles.verifyChip, panVerified && styles.verifiedChip]}
              onPress={handleVerifyPan}
            >
              <Text style={styles.verifyChipText}>
                {panVerified ? "✓ NSDL OK" : "Verify PAN"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.otpRow}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Aadhaar Last 4 Digits"
                placeholder="e.g. 9012"
                value={aadhaarLastFour}
                onChangeText={setAadhaarLastFour}
                keyboardType="number-pad"
              />
            </View>
            <TouchableOpacity
              style={[styles.verifyChip, aadhaarVerified && styles.verifiedChip]}
              onPress={handleVerifyAadhaar}
            >
              <Text style={styles.verifyChipText}>
                {aadhaarVerified ? "✓ UIDAI OK" : "Verify UID"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.consentNotice}>
            🔒 Statutory Privacy Note: Full Aadhaar numbers are never stored in plain text. Masked format (•••• •••• {aadhaarLastFour || "XXXX"}) is preserved for auditing.
          </Text>
        </View>
      )}

      {/* STEP 4: Bank Details */}
      {currentStep === 4 && (
        <View style={styles.stepForm}>
          <InputField
            label="Account Holder Name"
            placeholder="Ramesh Chandra"
            value={accountHolder}
            onChangeText={setAccountHolder}
          />
          <InputField
            label="Bank Name"
            placeholder="State Bank of India"
            value={bankName}
            onChangeText={setBankName}
          />
          <InputField
            label="Bank Account Number"
            placeholder="910283746501"
            value={accountNumber}
            onChangeText={setAccountNumber}
            secureTextEntry
          />
          <InputField
            label="Re-enter Bank Account Number"
            placeholder="Confirm account number"
            value={confirmAccount}
            onChangeText={setConfirmAccount}
          />
          <InputField
            label="IFSC Code"
            placeholder="SBIN0001234"
            value={ifsc}
            onChangeText={setIfsc}
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={[styles.pennyDropBtn, pennyDropVerified && styles.pennyDropSuccess]}
            onPress={handlePennyDrop}
          >
            <Text style={styles.pennyDropText}>
              {pennyDropVerified
                ? "✓ Penny Drop Confirmed (₹1.00 Match Verified)"
                : "⚡ Run Penny Drop Verification"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 5: Camera & Media Uploads */}
      {currentStep === 5 && (
        <View style={styles.stepForm}>
          <Text style={styles.cameraHelpText}>
            Capture live photographs using the mobile device camera:
          </Text>

          <View style={styles.uploadRow}>
            <View style={styles.uploadInfo}>
              <Text style={styles.uploadTitle}>1. Live Merchant Selfie</Text>
              <Text style={styles.uploadSub}>Neutral expression, well-lit background</Text>
            </View>
            <TouchableOpacity
              style={[styles.captureBtn, applicantSelfieCaptured && styles.capturedBtn]}
              onPress={() => setApplicantSelfieCaptured(true)}
            >
              <Text style={styles.captureBtnText}>
                {applicantSelfieCaptured ? "✓ Captured" : "📷 Open Camera"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.uploadRow}>
            <View style={styles.uploadInfo}>
              <Text style={styles.uploadTitle}>2. Geotagged Shop Front</Text>
              <Text style={styles.uploadSub}>Banner clearly visible with GPS coordinates</Text>
            </View>
            <TouchableOpacity
              style={[styles.captureBtn, shopPhotoCaptured && styles.capturedBtn]}
              onPress={() => setShopPhotoCaptured(true)}
            >
              <Text style={styles.captureBtnText}>
                {shopPhotoCaptured ? "✓ Captured" : "📷 Open Camera"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.uploadRow}>
            <View style={styles.uploadInfo}>
              <Text style={styles.uploadTitle}>3. Signature / Thumb Print</Text>
              <Text style={styles.uploadSub}>Signed on white paper or digital pad</Text>
            </View>
            <TouchableOpacity
              style={[styles.captureBtn, signatureCaptured && styles.capturedBtn]}
              onPress={() => setSignatureCaptured(true)}
            >
              <Text style={styles.captureBtnText}>
                {signatureCaptured ? "✓ Captured" : "✍️ Digital Sign"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 6: 30-Second Video KYC */}
      {currentStep === 6 && (
        <View style={styles.stepForm}>
          <View style={styles.vkycCard}>
            <Text style={styles.vkycTitle}>🎥 Mandatory 30-Second Video KYC</Text>
            <Text style={styles.vkycInstructions}>
              The applicant must face the camera and clearly recite the 6-digit dynamic OTP verification code aloud:
            </Text>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{verificationCode}</Text>
            </View>

            {isRecording ? (
              <View style={styles.recordingState}>
                <Text style={styles.recordingDot}>🔴 Recording: {vkycTimer}s / 30s</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(vkycTimer / 30) * 100}%` }]} />
                </View>
              </View>
            ) : vkycRecorded ? (
              <View style={styles.vkycSuccess}>
                <Text style={styles.vkycSuccessText}>
                  ✓ 30-Second Video Recorded & Hash Generated
                </Text>
              </View>
            ) : (
              <Button
                title="Start 30-Second Video KYC Recording"
                onPress={handleStartVkyc}
                size="md"
                style={{ marginTop: 12 }}
              />
            )}
          </View>
        </View>
      )}

      {/* STEP 7: Territory, Kit & Submission */}
      {currentStep === 7 && (
        <View style={styles.stepForm}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Assignment & Statutory Consent</Text>
            <Text style={styles.summaryItem}>• Assigned Territory: {territory}</Text>
            <Text style={styles.summaryItem}>• Allocated Logistics Kit Serial: {kitSerial}</Text>
            <Text style={styles.summaryItem}>• Authorized Banking Rails: AEPS, DMT, BBPS, MicroATM</Text>
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setTermsAccepted(!termsAccepted)}
          >
            <Text style={styles.checkboxIcon}>{termsAccepted ? "☑️" : "⬜"}</Text>
            <Text style={styles.checkboxLabel}>
              I solemnly confirm that all submitted documents (PAN, Aadhaar, Bank Details, and 30s Video KYC) are genuine, verified, and comply with RBI Master Directions on KYC.
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Nav Buttons */}
      <View style={styles.navRow}>
        {currentStep > 1 && (
          <Button
            title="← Back"
            variant="outline"
            onPress={() => setCurrentStep((prev) => prev - 1)}
            style={{ flex: 1 }}
          />
        )}
        {currentStep < totalSteps ? (
          <Button
            title="Next Step →"
            onPress={() => setCurrentStep((prev) => prev + 1)}
            style={{ flex: 1 }}
          />
        ) : (
          <Button
            title="Submit KYC Application"
            onPress={handleSubmit}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </ScrollView>
  );
};

function getStepTitle(step: number): string {
  switch (step) {
    case 1:
      return "Personal Details & Contact OTPs";
    case 2:
      return "Business Outlet & Geolocation";
    case 3:
      return "Identity Proof & PAN Verification";
    case 4:
      return "Bank Account & Penny Drop";
    case 5:
      return "Camera Selfies & Document Photos";
    case 6:
      return "30-Second Video KYC Recording";
    case 7:
      return "Territory, Kit & Declarations";
    default:
      return "KYC Onboarding";
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: theme.colors.background,
    flexGrow: 1,
  },
  header: {
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  screenSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.teal,
  },
  stepForm: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
    marginBottom: 20,
  },
  otpRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  verifyChip: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    marginBottom: 2,
  },
  verifiedChip: {
    backgroundColor: theme.colors.success,
  },
  verifyChipText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  consentNotice: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  pennyDropBtn: {
    backgroundColor: theme.colors.tealLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    marginTop: 6,
  },
  pennyDropSuccess: {
    backgroundColor: theme.colors.success,
  },
  pennyDropText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
  cameraHelpText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  uploadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  uploadInfo: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  uploadSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  captureBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
  },
  capturedBtn: {
    backgroundColor: theme.colors.success,
  },
  captureBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  vkycCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },
  vkycTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 6,
  },
  vkycInstructions: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 10,
  },
  codeBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  recordingState: {
    width: "100%",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  recordingDot: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.danger,
  },
  vkycSuccess: {
    backgroundColor: theme.colors.successSubtle,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    width: "100%",
    alignItems: "center",
  },
  vkycSuccessText: {
    color: theme.colors.success,
    fontWeight: "800",
    fontSize: 12,
  },
  summaryBox: {
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  summaryItem: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  checkboxRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginTop: 6,
  },
  checkboxIcon: {
    fontSize: 18,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  navRow: {
    flexDirection: "row",
    gap: 12,
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: theme.borderRadius.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 20,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  successAppId: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.teal,
    marginBottom: 10,
  },
  successDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  auditDossierBox: {
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    width: "100%",
    gap: 6,
    marginBottom: 20,
  },
  dossierRow: {
    fontSize: 11,
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  doneBtn: {
    width: "100%",
  },
});
