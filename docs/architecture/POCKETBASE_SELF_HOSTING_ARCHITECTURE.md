# PocketBase Self-Hosting & Local Architecture Guide

[← Back to Documentation Hub](../README.md) | [Architecture Overview](ARCHITECTURE.md) | [System Map](SYSTEM_MAP.md) | [Backend & Database](BACKEND_AND_DATABASE.md)

This document provides the authoritative architectural specification for running the **Practicum & OJT Management System** using **PocketBase** hosted locally on a dedicated host machine (e.g., laptop/workstation) and securely exposed via **Cloudflare Tunnels**. It covers dataflow, multi-layer security, spam prevention, error resilience, OneDrive persistence, and the Capstone Defense playbook.

---

## 1. Executive System Architecture

In this architecture, the entire platform runs as a self-contained, single-binary server on a host computer. External traffic reaches the host securely without opening incoming ports on your home or campus router.

```
                           [Student Mobile / Adviser Browser]
                                          │
                                          ▼ HTTPS (e.g. https://myojtportal.com)
                             [Cloudflare Edge Network]
                        (DDoS Protection, WAF, SSL Termination)
                                          │
                                          ▼ Encrypted Outbound-Only Tunnel
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ HOST MACHINE (Laptop / Workstation - Windows 10/11)                                    │
│                                                                                        │
│   cloudflared.exe (Tunnel Daemon)                                                      │
│        │                                                                               │
│        ▼ Forwarded to localhost:8090                                                   │
│   PocketBase Core Engine (pocketbase.exe)                                              │
│   ├── pb_public/                     (Compiled React 19 Frontend - Vite + Tailwind v4) │
│   ├── pb_data/                       (Embedded SQLite Database in WAL mode)            │
│   │    └── storage/                  (Local SSD File Storage: PDFs, DOCX, Signatures)  │
│   └── API & Auth Engine              (Role-based Collection API Rules, JWT Tokens)     │
│                                                                                        │
│   Express Sidecar Service (localhost:5000)                                             │
│   ├── Google Gemini AI API           (Document analysis & grammar auditing)            │
│   └── Microsoft OneDrive Sync        (Permanent local token storage: onedrive-token)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Blueprint

### A. Frontend Layer (`pb_public`)
* **Framework:** React 19, Vite, Tailwind CSS v4, PlateJS editor, Lucide React.
* **Serving Mechanism:** PocketBase features a high-performance built-in static file server. The compiled production build (`npm run build` $\to$ `dist/`) is placed inside `pb_public/`.
* **Single-Origin Benefits:** 
  * The frontend and backend share the exact same domain and port.
  * **Zero CORS issues:** The browser never blocks requests due to cross-origin resource sharing policies.
  * **Zero API configuration:** The client SDK connects directly to root `/`.

### B. Core Backend & Database (PocketBase)
* **Binary:** Single standalone executable (`pocketbase.exe`) written in Go.
* **Database Engine:** Embedded **SQLite** configured with Write-Ahead Logging (`WAL` mode) and memory-mapped I/O (`mmap`).
* **Scale Capability:** 
  * Concurrently serves **2,000 to 5,000+ requests per second**.
  * Easily manages **1,000+ active student, adviser, and supervisor accounts** with negligible CPU usage (< 1% idle, 30–60 MB RAM).

### C. Ingress & Tunnel Layer (`cloudflared`)
* **Technology:** Cloudflare Zero Trust Tunnel.
* **Mechanism:** The host machine establishes an **outbound-only TLS connection** to Cloudflare's closest edge data center.
* **No Port Forwarding:** Router ports `80` and `443` remain strictly closed.
* **Bypasses CGNAT:** Functions reliably across mobile hotspots, campus Wi-Fi, and residential ISPs with dynamic IP addresses.

### D. Sidecar Microservice (Express on port 5000)
* **Purpose:** Handles external enterprise integrations requiring specialized Node.js runtime libraries:
  * **Google Gemini AI** (`@google/genai`): Document analysis, rubric scoring, and text generation.
  * **Microsoft OneDrive Sync** (`@microsoft/microsoft-graph-client`): Automated backup of approved student documents to institutional OneDrive repositories.

---

## 3. Six-Layer Security Architecture

Self-hosting on a personal laptop requires rigorous security controls to ensure system integrity and privacy:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Cloudflare Edge (DDoS Shield, IP Obfuscation, WAF) │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Outbound-Only Tunnel (Zero Incoming Router Ports)  │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Admin Isolation (Cloudflare Zero Trust / Localhost)│
├─────────────────────────────────────────────────────────────┤
│ Layer 4: PocketBase API Rules (Role-Based Access Control)   │
├─────────────────────────────────────────────────────────────┤
│ Layer 5: Protected File Subsystem (Token-Gated Downloads)   │
├─────────────────────────────────────────────────────────────┤
│ Layer 6: Local Disk Encryption (Windows BitLocker & Bcrypt) │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1: Cloudflare Edge Shield
* **Hidden IP:** The host's real IP address is completely concealed. Attackers only see Cloudflare’s global proxy IPs.
* **Unmetered DDoS Mitigation:** Layer 3/4 and Layer 7 volumetric attacks are dropped at Cloudflare's edge before touching your internet connection.
* **Bot Fight Mode:** Blocks automated credential stuffing and malicious vulnerability scanners.

### Layer 2: Network & Host Isolation
* **Zero Inbound Punch-Through:** Your local firewall and router keep all inbound traffic blocked.
* **Port Pinpointing:** The tunnel daemon is strictly bound to `http://localhost:8090`. It is physically impossible for web users to traverse outside port 8090 into personal files, `C:\Windows`, or other running applications.

### Layer 3: Admin Panel Lockdown (`/_/`)
The PocketBase administrative interface (`https://yourdomain.com/_/`) is protected using a three-stage defense:
1. **Cloudflare Zero Trust Access Rule:** Intercepts any request to `/_/*` with a one-time PIN sent to the administrator's authorized email address. Unauthenticated users cannot view the login form.
2. **Multi-Factor Authentication (MFA):** Native TOTP authentication required for all superuser accounts.
3. **Localhost Restriction (Optional):** A Cloudflare WAF rule can block public access to `/_/` entirely, allowing administration strictly from `http://localhost:8090/_/` directly on the physical host machine.

### Layer 4: Collection API Rules (Data Authorization)
Data segregation between roles is enforced at the database engine level via Collection API Rules:

| Collection | Action | API Rule Expression | Security Effect |
| :--- | :--- | :--- | :--- |
| `student_documents` | **List/View** | `@request.auth.id != "" && (student_id = @request.auth.id \|\| @request.auth.role = "adviser" \|\| @request.auth.role = "admin")` | Students cannot view peers' submissions. Advisers and admins view assigned rosters. |
| `student_documents` | **Create** | `@request.auth.id != "" && @request.auth.role = "student" && @request.data.student_id = @request.auth.id` | Only authenticated students can submit, and they cannot spoof another student's ID. |
| `student_documents` | **Update** | `@request.auth.id != "" && ((student_id = @request.auth.id && status = "Draft") \|\| @request.auth.role = "adviser")` | Students can only edit draft files; approved documents are locked. |
| `student_documents` | **Delete** | `""` (Empty - Admin Only) | Regular users cannot purge records. |

### Layer 5: Protected File Subsystem
* Uploaded documents (PDFs, DOCX, signatures) in `student_documents` have the **Protected** attribute enabled.
* Direct URL scraping is impossible; PocketBase requires an active file token (`?token=...`) granted only to users satisfying the collection's View rule.
* Unauthorized access attempts return `HTTP 403 Forbidden`.

### Layer 6: Data Privacy & Cryptography
* **Password Hashing:** Passwords are encrypted using **bcrypt** with cryptographic work factors.
* **Data Sovereignty:** Student records, attendance logs, and personal evaluations never leave the local database, directly fulfilling institutional **Data Privacy Act (e.g., RA 10173)** requirements.
* **At-Rest Protection:** Host machine storage is secured using Windows **BitLocker drive encryption**.

---

## 4. Spam Prevention, Concurrency & Error Resilience

### A. Preventing Upload Spam & Hard Drive Flooding
To prevent users or automated scripts from spamming file uploads to exhaust local disk space:
1. **Frontend Submit Debounce:** UI submission buttons are locked immediately on click (`disabled={isSubmitting}`) with visual spinners.
2. **Database Unique Constraints:** A unique index on `(student_id, template_id)` ensures each student has exactly one submission record per requirement. Re-submitting updates the existing draft rather than creating redundant files.
3. **API Rate Limiting:** PocketBase limits incoming requests to 10 req/sec per IP.
4. **Cloudflare WAF Rate Limiting:** Free Cloudflare rules limit upload endpoints (`/api/collections/student_documents/*`) to a maximum of 5 requests per minute per IP.

### B. Network Drops & Atomic Transactions
* **Zero Ghost Files:** PocketBase file uploads are transactional. If a student loses connection mid-upload, the partially transmitted file is automatically pruned from the temporary directory, and the database record is rolled back.
* **Structured Toast Feedback:** Network errors return clear JSON error messages (`400 Validation Error`, `413 Payload Too Large`), surfaced to the user via toast notifications.

### C. Persistent OneDrive Integration
Unlike ephemeral serverless environments (e.g., Vercel) where `os.tmpdir()` is purged during container recycling:
* The host machine maintains a persistent filesystem.
* OAuth credentials in `backend/config/onedrive-token.json` persist across reboots, providing stable, permanent synchronization with institutional OneDrive drives without recurring authentication prompts.

---

## 5. Capacity & Limits Analysis (1,000 Students)

### A. Cloudflare Upload Limits
* **Per-Request Limit:** Cloudflare Free enforces a **100 MB maximum size per individual HTTP request**.
* **Real-World Document Sizes:**
  * Completed OJT Form / DOCX: **~0.5 MB to 2.5 MB**
  * Multi-page Scanned PDF: **~2.0 MB to 8.0 MB**
  * High-Resolution Signature: **~0.5 MB to 1.5 MB**
* *Verdict:* The 100 MB ceiling is 10 to 50 times larger than standard practicum files.
* **Concurrent Submissions:** The 100 MB limit applies **per connection**, not globally. If 10 students simultaneously submit 15 MB files (150 MB total in transit), Cloudflare passes all 10 requests concurrently.

### B. Storage Footprint on Local Host
* Average storage per student (12 required templates + DTRs + signatures): **~15 MB**.
* Total storage for 1,000 students: **~15 GB**.
* Easily accommodated on modern SSDs (128 GB–1 TB).

---

## 6. Host Machine Configuration Checklist (Windows)

To ensure uninterrupted uptime during multi-day testing or defense presentations:

1. **Power & Sleep Configuration:**
   * Open **Windows Settings $\to$ System $\to$ Power & Sleep**.
   * Set: *"When plugged in, turn off screen after: 15 minutes"*.
   * Set: *"When plugged in, put device to sleep after: **Never**"*.
2. **Lid Closure Action (Laptops):**
   * Open **Control Panel $\to$ Power Options $\to$ Choose what closing the lid does**.
   * Set: *"When I close the lid (Plugged in): **Do nothing**"*.
3. **Process Supervision (Auto-Restart on Crash):**
   * Use **NSSM** (Non-Sucking Service Manager) or **PM2** to run `pocketbase.exe` and `cloudflared.exe` as background Windows Services. If Windows restarts or updates, services resume automatically upon startup.
4. **Automated Database Backups:**
   * PocketBase provides scheduled database snapshots via **Admin UI $\to$ Settings $\to$ Backups**.
   * Configure daily backups scheduled to synchronize automatically with a local secondary drive or cloud backup.

---

## 7. Capstone Defense Playbook

### Why Panelists Value This Architecture
1. **Zero Recurring Infrastructure Cost:** Solves the primary critique of university projects abandoning operations after student credits expire on cloud platforms.
2. **Data Sovereignty & Privacy:** Conforms strictly to institutional data ownership policies by retaining student records locally rather than on third-party cloud tenancies.
3. **Enterprise Defense in Depth:** Combines global edge security (Cloudflare) with strict database-level API rules and token-gated storage.

### Panelist Q&A Reference

* **Q: "Why use SQLite instead of PostgreSQL for 1,000 students?"**
  * *Answer:* PocketBase runs SQLite in Write-Ahead Logging (WAL) mode with memory-mapped I/O, supporting thousands of concurrent reads and serialized sub-millisecond writes. For an institutional system handling 1,000 students with predictable submission windows, SQLite delivers superior speed, zero network latency between database and application, and eliminates external database cluster maintenance costs.

* **Q: "What happens if the school internet fails during our defense presentation?"**
  * *Answer:* The entire system is 100% self-contained. If the school Wi-Fi drops, we can navigate directly to `http://localhost:8090` on the host machine. The frontend, database, authentication, document generation, and workflows remain completely functional offline.

* **Q: "Is hosting on a local machine secure against external attacks?"**
  * *Answer:* Yes. The host router opens zero incoming ports. All traffic is brokered by Cloudflare Zero Trust over an encrypted outbound tunnel with edge DDoS mitigation, WAF rules, and token-based API authorization.
