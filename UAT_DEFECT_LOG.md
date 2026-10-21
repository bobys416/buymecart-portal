# Buymecart / IBNK — Team UAT Defect Management Log

**Document Version:** 1.0.0  
**Phase:** 8 — Team UAT & Acceptance Testing  
**Project:** Buymecart / IBNK High-Security Core Fintech Platform  
**Target Gate:** Formal Sign-Off for Phase 9 AWS Production Deployment  

---

## 1. Release Gate Policy

Prior to scheduling Phase 9 AWS Deployment:
- [ ] **Critical Severity Defects:** **Zero (0) open**.
- [ ] **High Severity Defects:** **Zero (0) open**, unless explicitly granted a written risk waiver with mitigation by the Platform Architect.
- [ ] **Financial & Ledger Integrity Tests:** **100% pass rate** (Zero un-balanced journals, zero overdrafts, zero double-refunds).
- [ ] **Access Control & RBAC Tests:** **100% pass rate** (Zero privilege escalation or cross-distributor leakage).
- [ ] **Formal Team Acceptance:** Sign-off from Lead Frontend Engineer, Lead Backend Engineer, and Security Lead.

---

## 2. Defect Severity Definitions

- **Critical (P0):** Data loss, double-entry ledger imbalance, unauthorized financial debit/credit, privilege escalation bypassing RBAC, server crash/hang, or remote code execution.
- **High (P1):** Core user journey blocked with no workaround, broken validation permitting invalid data entry, broken provider connection check, or unhandled 500 error on valid inputs.
- **Medium (P2):** Secondary workflow issue, cosmetic UI misalignment on mobile screens, non-blocking error message ambiguity, or minor latency deviation.
- **Low (P3):** Text typo, subtle styling inconsistency, minor tooltip omission, or minor enhancement request.

---

## 3. Active Defect Log

| Defect ID | Severity | Module / Screen | Tester & Role | Description & Reproduction Steps | Expected Behavior | Actual Behavior | Owner | Status | Retest Result |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **DEF-001** | Medium | Admin API Management | Security Auditor (Admin) | On clicking "Test Outbound Host" with invalid URL, dialog remained open without clear toast. | Toast notification displaying sanitized host rejection message. | Raw 400 error caught in console; modal stayed in loading state for 2s. | Frontend Team | **Resolved** | Fixed in `admin-api-management-module.tsx`; toast message added. |
| **DEF-002** | Low | Retailer Login | Mobile Tester (Retailer) | On iPhone SE (375px), login card padding caused slight horizontal jitter. | Responsive container margins with `px-4 sm:px-0`. | Slight horizontal scrollbar appeared on sub-400px viewports. | Frontend Team | **Resolved** | Added `overflow-x-hidden` container constraint. |
| *[New Entry]* | *Severity* | *Module* | *Name (Role)* | *Steps to reproduce...* | *Expected result...* | *Actual behavior observed...* | *Assignee* | *Open / In Progress / Resolved* | *Retest date & notes...* |

---

## 4. Defect Submission Template

To log a new defect, copy and paste the block below into Section 3:

```markdown
### [DEF-XXX] Title of Defect
- **Date Discovered:** YYYY-MM-DD
- **Reported By:** Tester Name (Assigned Role)
- **Module / Route:** e.g., `/admin/api-management` or `/retailer/dashboard`
- **Severity:** Critical / High / Medium / Low
- **Reproduction Steps:**
  1. Navigate to ...
  2. Input data ...
  3. Click ...
- **Expected Behavior:** ...
- **Actual Behavior:** ...
- **Evidence / Error Log:** (Paste sanitized error message or reference screenshot)
- **Assigned Owner:** ...
- **Resolution Status:** Open / In Progress / Fixed / Closed
- **Retest Verification:** (Date & Verification Result)
```

---

## 5. Formal UAT Sign-Off Record

*To be completed at the conclusion of Team UAT prior to Phase 9:*

| Role | Signee Name | Date | Decision | Signature / Status |
| :--- | :--- | :--- | :---: | :--- |
| **Platform Architect** | | | [ ] APPROVED<br>[ ] REJECTED | Pending UAT completion |
| **Security & Compliance Lead** | | | [ ] APPROVED<br>[ ] REJECTED | Pending UAT completion |
| **Engineering Lead** | | | [ ] APPROVED<br>[ ] REJECTED | Pending UAT completion |
| **Product Manager** | | | [ ] APPROVED<br>[ ] REJECTED | Pending UAT completion |
