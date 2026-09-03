# Data Breach Incident Response Runbook
**Statutory Framework: Section 8(6) of the Digital Personal Data Protection Act, 2023 (DPDP Act)**
*Document Version: 1.0 · Last Updated: September 3, 2026 · Organization: Sant Samagam Trust / AttendanceApp*

---

## 1. Statutory Mandate & Purpose
Under **Section 8(6) of the DPDP Act 2023**, in the event of a personal data breach, the Data Fiduciary (Sant Samagam Trust) is **legally mandated** to give the **Data Protection Board of India (DPBI)** and **each affected Data Principal (user)** intimation of such breach in such form and manner as may be prescribed.

This Runbook outlines the standard operational protocol to detect, contain, investigate, remediate, and report personal data breaches within the statutory timeframe (72 hours).

---

## 2. Incident Classification & Severity Matrix

| Severity Level | Definition | Statutory Action Required |
| :--- | :--- | :--- |
| **P1 - Critical** | Direct compromise of production database (MongoDB Atlas / Render), mass exfiltration of devotee contact info, GPS logs, or authentication tokens. | Immediate containment (<2h), Emergency Board convening, **DPBI & User Notice within 72h**. |
| **P2 - High** | Unauthorized administrative access to user records or Japmala logs without evidence of mass exfiltration. | Containment (<6h), forensic audit, internal logging, DPBI notification assessment. |
| **P3 - Medium** | Accidental exposure of an individual devotee's attendance or Jap count to another unauthorized member. | Direct user notification & data correction, internal logging. |
| **P4 - Low** | Blocked brute force attempt, expired token replay, or unexploited dependency vulnerability. | Security patch deployment, log archival. |

---

## 3. Step-by-Step Incident Response Timeline (72-Hour Protocol)

```
[Hour 0: Detection] ──► [Hour 0-4: Containment] ──► [Hour 4-24: Forensic Triage]
                                                              │
[Hour 48-72: DPBI & User Notice] ◄── [Hour 24-48: Impact Assessment]
```

### Phase 1: Detection & Immediate Containment (Hours 0 – 4)
1. **Isolate Affected Systems:**
   - Invalidate compromised JWT secret (`JWT_SECRET` in `.env` / Render environment) to immediately force re-authentication.
   - Rotate MongoDB database credentials in MongoDB Atlas and backend `.env`.
   - Restrict administrative IPs or enable Cloudflare "Under Attack" mode if applicable.
2. **Preserve Evidence:**
   - Take snapshot of server logs (`Render / Linux logs`).
   - Preserve database audit trails and request timestamps.

### Phase 2: Forensic Analysis & Impact Assessment (Hours 4 – 24)
1. Identify **exact categories of data breached**:
   - Identity: Names, phone numbers, email addresses.
   - Geolocation: GPS coordinates / event attendance logs.
   - Spiritual records: Japmala counts.
   - Security credentials: Password hashes (bcrypt).
2. Determine **number of affected Data Principals**.
3. Assess the likelihood of harm, identity theft, or harassment to devotees.

### Phase 3: Statutory Reporting & Notifications (Hours 24 – 72)
1. Transmit formal intimation to the **Data Protection Board of India (DPBI)**.
2. Transmit clear, plain-language notices to **all affected devotees**.
3. Log the incident in the internal Statutory Breach Register.

### Phase 4: Post-Incident Remediation & Prevention (Post 72 Hours)
1. Implement security patches and architectural fixes.
2. Conduct post-mortem review with legal counsel and technical team.
3. Update `DPDP_PROGRESS.md` with corrective measures.

---

## 4. Official Notice Template for Data Protection Board of India (DPBI)
*To be submitted electronically via the DPBI official portal / designated email within 72 hours of confirmation:*

```text
FORM OF INTIMATION OF PERSONAL DATA BREACH
(Under Section 8(6) of the Digital Personal Data Protection Act, 2023)

To:
The Secretary,
Data Protection Board of India (DPBI),
New Delhi, India.

1. DATA FIDUCIARY PARTICULARS:
   • Organization Name: Sant Samagam Trust
   • Registration / Identifier: [Insert Trust Registration Number]
   • Registered Address: Samagam Bhavan, North Goa - 403506, India
   • Grievance Officer: Shri Grievance Officer (privacy@santsamagam.org / +91 98765 43210)

2. DETAILS OF THE PERSONAL DATA BREACH:
   • Date & Time of Occurrence: [DD/MM/YYYY HH:MM IST]
   • Date & Time of Detection: [DD/MM/YYYY HH:MM IST]
   • Nature & Cause of Breach: [e.g., Unauthorized API access / database misconfiguration / compromised credentials]
   • Location of Incident: [Cloud Infrastructure - Render / MongoDB Atlas]

3. CATEGORIES & VOLUME OF PERSONAL DATA AFFECTED:
   • Categories of Data: [Name, Phone Number, Email, Event Attendance Timestamps, GPS Check-in Coordinates, Japmala Counts]
   • Number of Affected Data Principals (Devotees): [Estimated Count, e.g., 250 users]

4. POTENTIAL CONSEQUENCES & LIKELY IMPACT:
   • Risk of spam, phishing, or unauthorized contact to devotees.
   • Passwords were encrypted with bcrypt hashing and were [compromised / not compromised].

5. CONTAINMENT & REMEDIAL MEASURES TAKEN:
   • [e.g., Rotated all database credentials and JWT signing keys within 2 hours of detection.]
   • [e.g., Patched vulnerable API endpoint and added IP rate limiting.]
   • [e.g., Direct intimation issued to all affected Data Principals on DD/MM/YYYY.]

6. CONTACT FOR TECHNICAL INQUIRIES:
   • Technical Lead / DPO: Shri Grievance Officer (privacy@santsamagam.org)

Submitted on: [Date]
By Order of the Board of Trustees, Sant Samagam Trust
```

---

## 5. Official Notice Template for Affected Devotees / Users (Data Principals)
*To be transmitted via in-app notification, registered email, and SMS/WhatsApp:*

```text
Subject: Important Security Notice Regarding Your Sant Samagam Devotee Account

Dear Devotee / Member,

We are writing to inform you of a personal data security incident regarding the Sant Samagam application in accordance with our statutory obligations under Section 8(6) of the Digital Personal Data Protection Act, 2023.

1. WHAT HAPPENED:
On [Date], our security monitoring detected [brief plain-language description, e.g., unauthorized access to one of our server components]. We took immediate containment action within [X] hours to secure the system.

2. WHAT INFORMATION WAS INVOLVED:
The data potentially accessed includes:
• Your registered Name and Mobile Number / Email.
• Historical event attendance and Japmala counts.
[IMPORTANT: Your passwords are encrypted using strong cryptographic hashing and were NOT stored in plaintext.]

3. WHAT WE HAVE DONE:
• We immediately isolated the affected system and rotated all server access keys.
• We strengthened our API firewalls and access controls.
• We have formally notified the Data Protection Board of India (DPBI) as mandated by law.

4. WHAT YOU SHOULD DO:
• As a precaution, please log in to the application and update your password.
• Be vigilant against any unsolicited phone calls or messages requesting OTPs or financial details (Sant Samagam never asks for banking info or OTPs).

5. QUESTIONS & GRIEVANCE REDRESSAL:
If you have any questions or require assistance, you may reach our Data Protection & Grievance Officer directly:
• Email: privacy@santsamagam.org
• Phone: +91 98765 43210
• Online Rights Portal: Profile > Privacy & Data Rights > Rights Form

We deeply regret any concern this incident may cause and remain fully dedicated to safeguarding your personal data.

Sincerely,
Grievance Redressal Team
Sant Samagam Trust
```

---

## 6. Incident Contact Directory

| Role | Contact Person | Email | Phone |
| :--- | :--- | :--- | :--- |
| **Grievance Redressal Officer** | Shri Grievance Officer | `privacy@santsamagam.org` | `+91 98765 43210` |
| **Technical & Database Lead** | Lead Developer | `tech@santsamagam.org` | `+91 98765 43211` |
| **Legal Counsel** | Retained Privacy Counsel | `legal@santsamagam.org` | `+91 98765 43212` |
| **Statutory Authority** | Data Protection Board of India | `complaints@dpbi.gov.in` | `New Delhi, India` |
