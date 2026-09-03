# DPDP Act (India) 2023 Compliance Progress & Audit Log
**Application:** Sant Samagam Devotee Attendance & Japmala Management System
**Branch:** `compliance/dpdp` (Local audit branch — not pushed to remote)
**Audit Date:** September 3, 2026
**Framework:** Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023, Republic of India)

---

## 1. Personal Data Inventory & Collection Points Audit

| Data Element | Collection Point | Technical Storage | Purpose Under DPDP Sec 4/6 | Mandatory / Optional |
| :--- | :--- | :--- | :--- | :--- |
| **Full Name** | `RegisterScreen`, `AdminDashboard (Add User)`, `ProfileScreen` | `User.name` (MongoDB Atlas) | Identification of devotees for Satsang coordination & Jap records. | Mandatory for account |
| **Email Address** | `RegisterScreen`, `ForgotPasswordScreen` | `User.email` (MongoDB Atlas) | Authentication, OTP password reset verification, security alerts. | Mandatory for smartphone users |
| **Mobile Number** | `RegisterScreen`, `ProfileScreen`, `AdminDashboard` | `User.phone` (MongoDB Atlas) | Verification for event attendance, organizer communications. | Optional (recommended) |
| **Password** | `RegisterScreen`, `ResetPasswordScreen` | `User.password` (Salted & Hashed via `bcryptjs` 10 rounds) | Account access security. (Plaintext is never stored). | Mandatory |
| **GPS Location (Lat / Long)** | `EventAttendanceScreen`, `HomeScreen (Check-in)` | Transient request payload; verified against event radius | Proximity verification at active Satsang events. **Requested strictly on-demand; never tracked in background.** | Optional (only required to mark attendance) |
| **Japmala Chanting Records** | `JapmalaScreen`, `JapmalaReportScreen` | `Japmala` model (date, count, note, user_id) | Spiritual sadhana tracking and community aggregate reporting. | Optional |
| **IP Address & User Agent** | `compliance/consent` | `ConsentRecord` model | Immutable audit trail for consent verification (DPDP Sec 6). | System logged |

---

## 2. Trackers & Third-Party Processors Audit

| Service / Vendor | Role / Category | Data Disclosed | Cross-Border Transfer Status | Security & Compliance Status |
| :--- | :--- | :--- | :--- | :--- |
| **MongoDB Atlas** | Database Infrastructure | All persistent user documents & records | India (AWS/GCP Mumbai Region configured) | Encrypted at rest (AES-256) & in transit (TLS 1.3). |
| **Render.com** | Backend API Cloud Hosting | Transient HTTP request payloads | US / Global Cloud | HTTPS TLS enforced; reverse-proxy architecture. |
| **Vercel** | Frontend Web Hosting | Static web bundle assets & cached UI | Edge Global CDN | HTTPS enforced; no backend data stored on CDN. |
| **OpenStreetMap / Nominatim** | Reverse Geocoding | Latitude and Longitude coordinates | Global / EU servers | **Anonymized:** Coordinates sent without user ID, name, or phone number. |
| **Cloudflare CDN (`cdnjs`)** | PDF Rendering Script (`html2pdf.js`) | Client-side script delivery | Edge Global CDN | Subresource script only; no personal data transmitted to CDN. |
| **Google Fonts** | Typography CDN | Web font asset requests | Global CDN | Standard CSS/WOFF2 font delivery; no tracking cookies. |

---

## 3. Security Gap Analysis & Risk Assessment

| # | Security Domain | Findings & Current Posture | Risk Level | Remediation / Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Transport Security (HTTPS)** | Production frontend (Vercel) and backend (Render) enforce HTTPS TLS 1.3. Local development runs on HTTP `localhost:8081`. | **Low** | Enforce HSTS headers (`Strict-Transport-Security`) on Render production environment. |
| **2** | **Fail-Open Encryption / Storage** | Passwords are cryptographically hashed using `bcryptjs` with salt rounds. Database requires authenticated connection URI. | **Low** | Ensure `.env` is never committed to Git (verified in `.gitignore`). |
| **3** | **Bot Defense & Captcha** | OTP verification is implemented for registration (`OTPScreen.js`), but public endpoints currently lack Google reCAPTCHA / Cloudflare Turnstile. | **Medium** | Add Cloudflare Turnstile or rate limiting (`express-rate-limit`) on `/api/auth/login` and `/api/auth/register` to prevent credential stuffing. |
| **4** | **JWT Lifetime & Invalidation** | JWT tokens are issued with expiration. Invalidation occurs on client logout. | **Low** | Consider implementing token blacklisting or short-lived access tokens (15 min) + refresh tokens for heightened security. |
| **5** | **Rate Limiting** | Currently relies on Render's basic DDoS protection. | **Medium** | Add `express-rate-limit` middleware directly on sensitive backend auth endpoints. |

---

## 4. Summary of What Was Built

1. **Backend Consent Management Engine (`backend/models/ConsentRecord.js`)**:
   - Immutable audit logging of consent purposes, notice versions, IP address, and timestamps.
2. **Data Principal Rights & Grievance Backend (`backend/models/DataRightsRequest.js` & `backend/routes/compliance.js`)**:
   - `POST /api/compliance/consent`: Record and update consent states.
   - `GET /api/compliance/consent`: Retrieve active consent records.
   - `POST /api/compliance/data-rights`: Submit rights requests (Access, Correction, Erasure, Withdraw, Nominate, Grievance).
   - `GET /api/compliance/my-data`: Complete machine-readable personal data dump (JSON) for Section 11 Data Portability.
   - `GET /api/compliance/grievance-info`: Public Grievance Officer details and 30-day SLA commitments.
   - `GET & PATCH /api/compliance/admin/requests`: Admin dashboard endpoints to manage and fulfill rights requests.
3. **Statutory Privacy Notice (`frontend/src/screens/PrivacyPolicyScreen.js`)**:
   - DPDP Section 5 notice covering data categories, legal grounds, retention, processors, user rights, and Grievance Officer contacts.
4. **Terms of Service with DPDP Data Protection Clause (`frontend/src/screens/TermsScreen.js`)**:
   - Comprehensive community terms with dedicated fiduciary obligations, security safeguards, and breach notification commitments.
5. **Interactive Data Rights Portal (`frontend/src/screens/DataRightsScreen.js`)**:
   - Self-service portal allowing devotees to download their data dump (JSON), submit correction/erasure requests, manage consent, and designate nominees.
6. **Unbundled Opt-In Checkboxes on Registration (`frontend/src/screens/RegisterScreen.js`)**:
   - Unticked-by-default checkboxes for Essential Account processing, Location verification, Japmala community records, and 18+ age confirmation (DPDP Sec 9).
7. **Non-Essential Tracker / Cookie Consent Banner (`frontend/src/components/ConsentBanner.js`)**:
   - Floating banner for web & mobile web to accept essential or all trackers.
8. **Data Breach Incident Response Runbook (`BREACH_RUNBOOK.md`)**:
   - Standard Operating Procedure for 72-hour DPBI notification and affected user notification templates.

---

## 5. Items Flagged for Legal Counsel Review

> [!WARNING]
> The technical implementations adhere strictly to the provisions of the Digital Personal Data Protection Act, 2023. However, the following legal texts must be formally reviewed and signed off by your organization's legal counsel before public launch:

1. **[LEGAL REVIEW] Privacy Notice Copy (`PrivacyPolicyScreen.js`)**:
   - Confirm official organization legal name (e.g., *Sant Samagam Trust / Association*).
   - Confirm retention periods for spiritual sadhana archives vs transactional account records.
2. **[LEGAL REVIEW] Data Protection Clause in Terms (`TermsScreen.js`)**:
   - Verify limitation of liability clauses under Indian contract law and the Information Technology Act, 2000.
3. **[LEGAL REVIEW] Grievance Redressal Officer Particulars**:
   - Update placeholder details (`Shri Grievance Officer`, `privacy@santsamagam.org`, phone number, and registered physical address in Goa) with your actual designated personnel.
4. **[LEGAL REVIEW] 72-Hour Breach Notification Form (`BREACH_RUNBOOK.md`)**:
   - Review notification templates against rules published by the Ministry of Electronics and Information Technology (MeitY) once DPBI procedural rules are gazetted.

---

## 6. Open Items & Future Roadmap

- [ ] **Rate Limiting Middleware:** Integrate `express-rate-limit` on `/api/auth/*` routes in backend.
- [ ] **Turnstile / Captcha:** Add Cloudflare Turnstile on public web registration forms.
- [ ] **Parental Consent Verification Mechanism:** For devotees under 18, implement a secondary guardian verification OTP flow if minors are onboarded independently.
- [ ] **Admin Rights Dashboard UI:** Create a dedicated tab in `AdminDashboard.js` to view and click-to-resolve pending `DataRightsRequest` items submitted by devotees.
