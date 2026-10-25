# iOS Implementation Readiness

## Summary

The repository includes an iOS-targeted Expo React Native mobile app. It clearly declares iOS capabilities for camera, photo library, microphone, and Face ID. The architectural foundation is present, but production readiness for iOS still requires device-level hardening and security review.

## Findings

### 1. iOS app configuration exists

In `mobile/app.json`, the app declares:

- iOS bundle identifier: `org.buymecart.mobile`
- `supportsTablet: true`
- `NSCameraUsageDescription`
- `NSMicrophoneUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSFaceIDUsageDescription`

This confirms the app is designed for iPhone and iPad scenarios and is ready to request permissions for sensitive mobile fintech flows.

### 2. Key iOS readiness areas

| Area | Status | Notes |
|---|---|---|
| iPhone support | Partial | App structure is ready for iPhone layouts. |
| iPad support | Partial | Tablet support exists at config level; needs validation. |
| Multiple screen sizes | Partial | Need screen matrix validation and responsive UI testing. |
| Face ID / Touch ID | Partial | Capability is declared and app-level service exists. |
| Secure Keychain storage | Partial | Storage abstraction exists, but must be enforced with true native secure storage. |
| Camera and document upload | Partial | Permissions exist; need end-to-end KYC validation and upload contract review. |
| Push notifications | Not ready | No registration or APNs integration documented. |
| Network interruption handling | Partial | Offline queue exists, but behavior must be tested on cellular loss. |
| Lifecycle handling | Partial | App lifecycle is partly managed in navigation and session logic. |
| Secure auth/session | Partial | Token restoration exists, yet session expiry and secure lifetime management are not production-grade. |

## Security considerations for iOS

- Important: The secure storage abstraction in `mobile/src/services/secure-storage.ts` falls back to memory on unsupported environments. That is acceptable for test or non-native runtime, but not for production iOS app builds.
- Face ID and biometric readiness are present as a capability, but the app must enforce auth before sensitive financial operations on the backend and in UX.
- Rooted or jailbroken device risk should be assessed for premium risk flows and high-value payment actions.
- Sensitive screens may require screenshot protection if supported by the platform and policy. This should be considered for wallet and KYC views.

## Recommendations

1. Keep Expo + React Native for iOS implementation.
2. Enforce secure storage with a true native keystore/keychain-backed layer.
3. Add measured iOS session expiry and revoke behavior.
4. Add APNs registration and notification handling.
5. Validate on multiple iPhone sizes and iPad forms.
6. Validate secure camera and document-upload flows end-to-end.

## Readiness verdict

The iOS foundation is real and promising. The app already declares the right permissions and capabilities, but final production readiness depends on secure storage, lifecycle hardening, secure session enforcement, and device validation across iPhone/iPad sizes.
