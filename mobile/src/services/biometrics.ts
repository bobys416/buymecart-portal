/**
 * Biometric Authentication Service for BuyMeCart Mobile
 * Handles Face ID / Fingerprint sensor checks and biometric challenge prompts.
 */

export interface BiometricStatus {
  isAvailable: boolean;
  biometryType: "FaceID" | "Fingerprint" | "Iris" | "None";
  isEnrolled: boolean;
}

class BiometricService {
  private isSimulatedSuccess: boolean = true;

  async checkBiometrics(): Promise<BiometricStatus> {
    try {
      const LocalAuth = (globalThis as unknown as {
        ExpoLocalAuthentication?: {
          hasHardwareAsync: () => Promise<boolean>;
          isEnrolledAsync: () => Promise<boolean>;
          supportedAuthenticationTypesAsync: () => Promise<number[]>;
        };
      }).ExpoLocalAuthentication;

      if (LocalAuth) {
        const hasHardware = await LocalAuth.hasHardwareAsync();
        const isEnrolled = await LocalAuth.isEnrolledAsync();
        return {
          isAvailable: hasHardware,
          biometryType: "Fingerprint",
          isEnrolled,
        };
      }

      // Default mock for simulator / dev environment
      return {
        isAvailable: true,
        biometryType: "Fingerprint",
        isEnrolled: true,
      };
    } catch {
      return {
        isAvailable: false,
        biometryType: "None",
        isEnrolled: false,
      };
    }
  }

  async authenticate(promptMessage: string = "Authenticate to access BuyMeCart"): Promise<{ success: boolean; error?: string }> {
    try {
      const LocalAuth = (globalThis as unknown as {
        ExpoLocalAuthentication?: {
          authenticateAsync: (opts: { promptMessage: string }) => Promise<{ success: boolean; error?: string }>;
        };
      }).ExpoLocalAuthentication;

      if (LocalAuth) {
        const result = await LocalAuth.authenticateAsync({ promptMessage });
        return { success: result.success, error: result.error };
      }

      // Simulated environment verification
      if (this.isSimulatedSuccess) {
        return { success: true };
      }
      return { success: false, error: "Simulated biometric mismatch" };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }

  setSimulatedSuccess(success: boolean) {
    this.isSimulatedSuccess = success;
  }
}

export const biometricService = new BiometricService();
