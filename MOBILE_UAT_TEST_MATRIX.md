# Mobile UAT Test Matrix

## Objective

Validate that the existing mobile app and web app work cohesively for retailer operations while preserving the backend financial architecture and security requirements.

## Test matrix

| Area | Scenario | Device / Mode | Expected Result |
|---|---|---|---|
| Authentication | Login with valid retailer credentials | Android phone | User is authenticated and routed to retailer dashboard |
| Authentication | Login with admin / distributor credentials | Android phone | Role-specific dashboard loads correctly |
| Authentication | Biometric sign-in | iPhone / Android with biometrics | Secure auth succeeds or fails gracefully |
| Authentication | Session expiration | Mobile app after timeout | App prompts for re-authentication and clears stale state |
| Dashboard | Retailer dashboard loads | Phone / tablet | Key wallet and action cards render without overflow |
| Dashboard | Refresh gesture | Phone | Data refresh works without layout break |
| Wallet | Wallet balance card renders | Portrait and landscape | No clipping, overflow, or broken text alignment |
| Services | Recharge flow entry | Phone | Touch targets work and modal opens with proper spacing |
| Services | Banking flow entry | Phone | Bank action UI loads in safe area |
| Services | BBPS flow entry | Phone | Bill payment flow is accessible and readable |
| Payment Request | Submit valid payment request | Phone | Confirmation and status flow is clear and consistent |
| Payment Status | Poll pending transaction | Phone | Status is updated without data loss |
| Wallet Ledger | Transaction list | Phone | List is readable and paginated or scroll-friendly |
| Search | Search transaction by reference or amount | Phone | Results are filtered accurately |
| Margins | View merchant margin data | Phone | Scrolling and table/card conversion remain usable |
| Reports | View reports summary | Tablet / phone | Content is readable and responsive |
| KYC | Upload KYC docs | Android / iOS | Camera/gallery flow works and response is handled correctly |
| Help desk | Open support / contact screen | Phone | Help content is accessible and legible |
| Network | App loses network | Phone | Offline banner and queue behavior appear correctly |
| Network | Network resumes | Phone | Offline queued actions are retried or re-synced |
| Security | Sensitive screen access before auth | Any device | Screen blocks unauthorized access |
| Security | Screenshot protection policy check | iOS / Android where supported | Sensitive screens behave in line with policy |
| Layout | Small phone portrait | 360x640 and similar | No horizontal overflow, proper font scaling |
| Layout | Large phone landscape | Landscape mode | No cut-off content or broken spacing |
| Layout | Tablet view | Android/iPad | Content expands appropriately without awkward duplication |
| Accessibility | Tap targets and text scaling | All devices | Controls remain tap-friendly and legible |
| Payment UX | Confirm financial action | Phone | User is asked for clear confirmation before high-risk action |

## Acceptance criteria

- No horizontal overflow on any supported screen
- Bottom tab or navigation patterns remain usable on standard mobile sizes
- Modals are sized to viewport constraints
- Transaction flows respect the same backend ledger rules as web and admin workflows
- All sensitive financial actions require backend authorization
- Mobile UX is aligned with the existing Buymecart design language and not a separate brand styling system

## Must-pass quality gates

- Secure token storage is in place for production use
- Session expiration is handled without stale state
- KYC upload is validated end-to-end
- Payment request flows are idempotent and confirmed
- Network loss and session expiry are tested on real devices
- Accessibility and touch sizing pass review

## Recommendation

Treat this as a production-readiness matrix for the next implementation phase. Do not treat the existing prototype as a final mobile fintech release until all pass conditions above are validated on real device builds.
