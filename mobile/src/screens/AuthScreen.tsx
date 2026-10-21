import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { loginSchema, registerSchema } from "@buymecart/validation";
import { UserProfile, PlatformRole } from "@buymecart/shared-types";
import { theme } from "../theme";
import { InputField } from "../components/InputField";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { biometricService } from "../services/biometrics";
import { secureStorage } from "../services/secure-storage";

export interface AuthScreenProps {
  onSuccess: (user: UserProfile) => void;
  onForgotPassword: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  onForgotPassword,
}) => {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<PlatformRole>("retailer");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2FA OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [otpTimer, setOtpTimer] = useState(30);

  const determineRoleFromIdentifier = (idStr: string): { role: PlatformRole; portal: "admin" | "distributor" | "retailer" | "mobile"; orgScope: string; name: string } => {
    const lower = idStr.toLowerCase();
    if (lower.includes("admin")) {
      return {
        role: "admin",
        portal: "admin",
        orgScope: "SYSTEM-WIDE",
        name: "Admin Master User",
      };
    }
    if (lower.includes("super") || lower.includes("sd")) {
      return {
        role: "super_distributor",
        portal: "distributor",
        orgScope: "SD-CENTRAL-01",
        name: "Central Spark FinTech (SD)",
      };
    }
    if (lower.includes("area") || lower.includes("ad")) {
      return {
        role: "area_distributor",
        portal: "distributor",
        orgScope: "AD-ZONE-01",
        name: "Sunil Verma (AD)",
      };
    }
    return {
      role: "retailer",
      portal: "retailer",
      orgScope: "RET-ZONE-01-401",
      name: lower.includes("@") ? lower.split("@")[0] : "Patel Digital Kendra",
    };
  };

  const handleSignIn = async () => {
    setErrorMessage(null);
    const parsed = loginSchema.safeParse({ identifier, password });
    if (!parsed.success) {
      setErrorMessage(parsed.error.errors[0]?.message || "Validation error");
      return;
    }

    setLoading(true);
    try {
      const roleMeta = determineRoleFromIdentifier(identifier);
      const user: UserProfile = {
        id: `usr-${Date.now()}`,
        name: roleMeta.name,
        email: identifier.includes("@") ? identifier : `${identifier}@buymecart.org`,
        phone: identifier.includes("@") ? "9876543210" : identifier,
        role: roleMeta.role,
        portal: roleMeta.portal,
        orgScope: roleMeta.orgScope,
        kycVerified: true,
        createdAt: new Date().toISOString(),
      };

      // Trigger 2FA OTP Modal
      setPendingUser(user);
      setShowOtpModal(true);
      setOtpTimer(30);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndLogin = async () => {
    if (!pendingUser) return;
    if (otpCode.trim().length < 4) {
      Alert.alert("Invalid OTP", "Please enter the 4-digit verification code sent to your RMN.");
      return;
    }

    await secureStorage.setTokens(`jwt_token_${pendingUser.role}_session`, "mock_refresh_jwt");
    setShowOtpModal(false);
    onSuccess(pendingUser);
  };

  const handleQuickFixtureLogin = async (role: PlatformRole) => {
    setErrorMessage(null);
    setLoading(true);
    try {
      let user: UserProfile;
      switch (role) {
        case "admin":
          user = {
            id: "usr-admin-01",
            name: "Admin Master User",
            email: "admin@buymecart.org",
            phone: "9800000001",
            role: "admin",
            portal: "admin",
            orgScope: "SYSTEM-WIDE",
            kycVerified: true,
            createdAt: new Date().toISOString(),
          };
          break;
        case "super_distributor":
          user = {
            id: "usr-sd-01",
            name: "Central Spark FinTech Pvt Ltd",
            email: "sd@buymecart.org",
            phone: "9800000002",
            role: "super_distributor",
            portal: "distributor",
            orgScope: "SD-CENTRAL-01",
            kycVerified: true,
            createdAt: new Date().toISOString(),
          };
          break;
        case "area_distributor":
          user = {
            id: "usr-ad-01",
            name: "Sunil Verma",
            email: "ad@buymecart.org",
            phone: "9800000003",
            role: "area_distributor",
            portal: "distributor",
            orgScope: "AD-ZONE-01",
            kycVerified: true,
            createdAt: new Date().toISOString(),
          };
          break;
        case "retailer":
        default:
          user = {
            id: "usr-ret-01",
            name: "Patel Digital Kendra (Rajesh Patel)",
            email: "retailer@buymecart.org",
            phone: "9898989898",
            role: "retailer",
            portal: "retailer",
            orgScope: "RET-ZONE-01-401",
            kycVerified: true,
            createdAt: new Date().toISOString(),
          };
          break;
      }

      await secureStorage.setTokens(`mock_jwt_${role}_session`, "mock_refresh_token");
      onSuccess(user);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setErrorMessage(null);
    const auth = await biometricService.authenticate("Authenticate with Biometrics to BuyMeCart");
    if (auth.success) {
      const bioUser: UserProfile = {
        id: "usr-bio-01",
        name: "Rajesh Patel (Biometric Verified)",
        email: "retailer@buymecart.org",
        phone: "9898989898",
        role: "retailer",
        portal: "retailer",
        orgScope: "RET-ZONE-01-401",
        kycVerified: true,
        biometricsEnabled: true,
        createdAt: new Date().toISOString(),
      };
      await secureStorage.setTokens("mock_bio_jwt_buymecart_mobile");
      onSuccess(bioUser);
    } else {
      setErrorMessage(auth.error || "Biometric authentication failed");
    }
  };

  const handleSignUp = async () => {
    setErrorMessage(null);
    const parsed = registerSchema.safeParse({
      fullName,
      email,
      phone,
      role: selectedRole,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.errors[0]?.message || "Registration validation error");
      return;
    }

    setLoading(true);
    try {
      const newUser: UserProfile = {
        id: `usr-${Date.now()}`,
        name: fullName,
        email,
        phone,
        role: selectedRole,
        portal: selectedRole === "admin" ? "admin" : selectedRole === "retailer" ? "retailer" : "distributor",
        orgScope: selectedRole === "super_distributor" ? "SD-NEW" : selectedRole === "area_distributor" ? "AD-NEW" : "RET-NEW",
        kycVerified: false,
        createdAt: new Date().toISOString(),
      };

      await secureStorage.setTokens("mock_access_jwt_new_user");
      onSuccess(newUser);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Dev Environment Notice */}
      <View style={styles.devTag}>
        <Text style={styles.devTagText}>DEV MODE FIXTURES CONFIGURED</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandText}>BUYMECART + IBNK</Text>
        </View>
        <Text style={styles.title}>
          {tab === "signin" ? "Portal Sign In" : "Register Channel Account"}
        </Text>
        <Text style={styles.subtitle}>
          {tab === "signin"
            ? "Sign in to access your role-authorized mobile console."
            : "Register as an Area Distributor, Super Distributor, or Retailer."}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => {
            setTab("signin");
            setErrorMessage(null);
          }}
          style={[styles.tabButton, tab === "signin" && styles.activeTabButton]}
        >
          <Text style={[styles.tabText, tab === "signin" && styles.activeTabText]}>
            Sign In
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setTab("signup");
            setErrorMessage(null);
          }}
          style={[styles.tabButton, tab === "signup" && styles.activeTabButton]}
        >
          <Text style={[styles.tabText, tab === "signup" && styles.activeTabText]}>
            Register
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      )}

      {/* Sign In Form */}
      {tab === "signin" ? (
        <View style={styles.form}>
          <InputField
            label="Mobile Number or Email"
            placeholder="e.g. admin@buymecart.org or 9898989898"
            value={identifier}
            onChangeText={setIdentifier}
            keyboardType="email-address"
          />
          <InputField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity onPress={onForgotPassword} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In with Credentials"
            onPress={handleSignIn}
            loading={loading}
            size="lg"
            style={styles.actionBtn}
          />

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR USE BIOMETRICS</Text>
            <View style={styles.line} />
          </View>

          <Button
            title="⚡ Sign In with Biometrics (Face ID / Fingerprint)"
            onPress={handleBiometricLogin}
            variant="outline"
            size="md"
            style={styles.bioBtn}
          />

          {/* Development Quick Role Fixtures */}
          <View style={styles.fixtureSection}>
            <Text style={styles.fixtureTitle}>
              🛠️ [DEV FIXTURES] Quick Role Launch (Testing Only):
            </Text>
            <View style={styles.fixtureGrid}>
              <TouchableOpacity
                style={styles.fixtureBtn}
                onPress={() => handleQuickFixtureLogin("admin")}
              >
                <Text style={styles.fixtureBtnText}>🛡️ Admin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fixtureBtn}
                onPress={() => handleQuickFixtureLogin("super_distributor")}
              >
                <Text style={styles.fixtureBtnText}>🏢 Super Dist</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fixtureBtn}
                onPress={() => handleQuickFixtureLogin("area_distributor")}
              >
                <Text style={styles.fixtureBtnText}>📍 Area Dist</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fixtureBtn}
                onPress={() => handleQuickFixtureLogin("retailer")}
              >
                <Text style={styles.fixtureBtnText}>🏪 Retailer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        /* Sign Up Form */
        <View style={styles.form}>
          <InputField
            label="Full Name"
            placeholder="e.g. Sunil Verma"
            value={fullName}
            onChangeText={setFullName}
          />
          <InputField
            label="Email Address"
            placeholder="sunil@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <InputField
            label="10-Digit Mobile Number"
            placeholder="9876543210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.roleLabel}>Select Portal Role:</Text>
          <View style={styles.rolesRow}>
            {(["retailer", "area_distributor", "super_distributor"] as PlatformRole[]).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setSelectedRole(r)}
                style={[
                  styles.roleChip,
                  selectedRole === r && styles.selectedRoleChip,
                ]}
              >
                <Text
                  style={[
                    styles.roleChipText,
                    selectedRole === r && styles.selectedRoleChipText,
                  ]}
                >
                  {r === "super_distributor"
                    ? "SUPER DIST"
                    : r === "area_distributor"
                    ? "AREA DIST"
                    : "RETAILER"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <InputField
            label="Password"
            placeholder="Min 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <InputField
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button
            title="Register Account"
            onPress={handleSignUp}
            loading={loading}
            size="lg"
            style={styles.actionBtn}
          />
        </View>
      )}

      {/* 2FA OTP Verification Modal */}
      <Modal visible={showOtpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔒 Two-Factor OTP Verification</Text>
            <Text style={styles.modalSub}>
              Enter the 4-digit verification code dispatched to your registered mobile {pendingUser?.phone || "RMN"}:
            </Text>

            <View style={styles.otpNotice}>
              <Text style={styles.otpNoticeText}>
                [DEV SIMULATION CODE]: 4921
              </Text>
            </View>

            <InputField
              label="Enter 4-Digit OTP"
              placeholder="e.g. 4921"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
            />

            <View style={styles.modalActions}>
              <Button
                title="✓ Verify & Enter Portal"
                onPress={handleVerifyOtpAndLogin}
                style={{ flex: 1 }}
              />
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowOtpModal(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  devTag: {
    alignSelf: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 8,
  },
  devTagText: {
    fontSize: 9,
    color: theme.colors.teal,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  header: {
    alignItems: "center",
    marginTop: 14,
    marginBottom: 20,
  },
  brandBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 10,
  },
  brandText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: theme.borderRadius.sm,
  },
  activeTabButton: {
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  errorBox: {
    backgroundColor: "#FFF1F2",
    padding: 10,
    borderRadius: theme.borderRadius.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FECDD3",
  },
  errorText: {
    fontSize: 11,
    color: theme.colors.danger,
    fontWeight: "600",
  },
  form: {
    gap: 12,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: -4,
  },
  forgotText: {
    fontSize: 11,
    color: theme.colors.tealDark,
    fontWeight: "700",
  },
  actionBtn: {
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  orText: {
    fontSize: 9,
    fontWeight: "800",
    color: theme.colors.textMuted,
    marginHorizontal: 8,
  },
  bioBtn: {
    marginBottom: 12,
  },
  fixtureSection: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 6,
  },
  fixtureTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 8,
  },
  fixtureGrid: {
    flexDirection: "row",
    gap: 6,
  },
  fixtureBtn: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fixtureBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
    marginTop: 4,
  },
  rolesRow: {
    flexDirection: "row",
    gap: 6,
  },
  roleChip: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedRoleChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.textSecondary,
  },
  selectedRoleChipText: {
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(16, 28, 50, 0.65)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    gap: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  modalSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  otpNotice: {
    backgroundColor: theme.colors.tealSubtle,
    padding: 8,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },
  otpNoticeText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.tealDark,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
});
