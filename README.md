# AICTE Approval Intelligence (SIH26262)

> **Integrated Application Workflow, Compliance Monitoring, Dependency/Blocker Management, and Alerting System**  
> *Developed for Smart India Hackathon (SIH) 2026 · Problem Statement ID: SIH26262*

---

## 📌 Executive Summary

While standard administrative software (e.g. NIC eOffice, generic BPMN engines, ticketing tools) can digitize file routing, timers, and approval forms, they lack **domain-specific regulatory compliance intelligence**. When an institution's application is delayed, these tools display vague statuses such as *"Pending"* without explaining:
1. **Which regulatory requirement applies** under the AICTE Approval Process Handbook (APH).
2. **Whether submitted evidence genuinely satisfies the statutory criteria**.
3. **Why a case is stuck, what prerequisite is missing, and who must act next**.

**AICTE Approval Intelligence** layers deterministic regulatory and dependency intelligence on top of the approval workflow. It links every application to statutory evidence items, computes stage ageing against normative SLAs, flags expiring or deficient certificates, diagnoses causal blockers, enforces strict stage guardrails, and maintains an immutable audit trail.

---

## 🏛️ System Architecture

The prototype is built with a clean, decoupled 3-tier architecture that runs entirely in modern web browsers without requiring complex server installations, while using repository patterns that allow drop-in replacement with a FastAPI / PostgreSQL backend.

```
aicte-approval-intelligence/
├── index.html                  # Main application shell, modal containers & role selector
├── styles.css                  # Custom institutional design system (restrained palette, responsive)
├── data.js                     # Illustrative APH regulatory catalog & synthetic seed records
├── engine.js                   # Rule & Blocker Intelligence Engine (Deterministic prerequisite logic)
├── store.js                    # Data Access Layer & State Store (localStorage persistence)
├── utils.js                    # UI utilities, stage pipeline generator, ageing bars & toast notices
├── components.js               # Interactive modals (detail drawer, audit, deficiency, upload, transitions)
├── app.js                      # Central router, role manager, global search & notifications
├── views/
│   ├── dashboard.js            # Executive dashboard (KPIs, stage doughnut, SLA ageing chart)
│   ├── applications.js         # Applications console (search, multi-filters, sorting, intake wizard)
│   ├── compliance.js           # Evidence register (APH clauses, upload dates, expiry monitoring)
│   ├── blockers.js             # Blocker Intelligence Engine (4-part causal diagnosis & unblocking)
│   ├── alerts.js               # SLA follow-ups & task management (acknowledgement, resolution, reassignment)
│   └── audit.js                # Statutory append-only audit registry with actor signatures
└── tests/
    └── run_tests.js            # Automated test suite verifying rules, guardrails, and persistence
```

---

## 🚀 Setup & Run Instructions

### Option 1: Live Local HTTP Server (Recommended)
You can run the built-in HTTP server using Python:

```bash
# Navigate to the project directory
cd "C:\Users\Srajan kulal\.gemini\antigravity\scratch\aicte-approval-intelligence"

# Start the server on port 3000
python -m http.server 3000
```
Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**

### Option 2: Direct File Open
Double-click `index.html` or open it directly in any browser (Chrome, Edge, Firefox, Safari).  
All assets, icons, and chart libraries are self-contained or loaded via standard CDNs.

### Running the Automated Test Suite
Verify all regulatory rules, stage transition guardrails, and persistence:
```bash
node tests/run_tests.js
```

---

## 🎯 Implemented Features

### 1. Role-Based Access (3 Distinct Personas)
- **Institution Coordinator (`Dr. Suresh Patil`):** Submit applications, view institutional compliance status, upload evidence, respond to deficiency memos, and track stage progress.
- **Scrutiny Officer / Reviewer (`Prof. Rajiv Sharma`):** Evaluate applications, audit submitted evidence (verify/reject/expire), issue deficiency memos with 15-day statutory rectification windows, and advance applications.
- **Administrator (`Dr. Meenakshi Sundaram`):** National overview across all regions, monitor stage ageing vs SLAs, reassign evaluation officers, and review central audit logs.

### 2. Rule-Based Blocker Intelligence (Core Differentiator)
Unlike conventional workflow systems that show opaque statuses, our deterministic dependency engine displays 5 explicit attributes for every blocked case:
1. **What is blocked:** Specific downstream stage (e.g. *Expert Visit Committee Inspection* or *Regional Review*).
2. **Why it is blocked:** Plain-language root cause diagnosis based on recorded evidence.
3. **Which prerequisite is incomplete:** Exact statutory citation (e.g. *State Government NOC under APH 1.3*).
4. **Who is responsible:** Designated officer, committee, or institution coordinator.
5. **What action should happen next:** Concrete remedial steps to clear the blocker.

### 3. Workflow Guardrails
The system **actively prevents invalid stage transitions**. If an officer attempts to advance an application to the physical inspection (`expert_visit`) or decision (`approved`) stage while statutory prerequisites remain unverified or expired, the transition is blocked and the officer is presented with an itemized prerequisite checklist.

### 4. Interactive Deficiency & Resubmission Loop
Reviewers can raise deficiency memos against specific APH clauses. The system automatically halts the scrutiny calendar, marks the application as `deficiency`, notifies the institution, generates a gatekeeper blocker, and sets a statutory deadline. Institutions can upload corrected evidence and formally resubmit the application for re-scrutiny.

### 5. Compliance & Expiry Monitoring
Tracks statutory documents with validity windows (e.g., Fire Safety NOCs, Bank FDRs). Documents past their renewal date are automatically flagged as `Expired Evidence` and generate critical alerts.

### 6. LocalStorage Persistence
All created applications, verified evidence items, resolved blockers, acknowledged alerts, and audit trail entries are automatically persisted in browser `localStorage`. A **Reset Demo** button in the top navigation allows resetting to the initial clean demonstration state at any time.

---

## 🧪 Step-by-Step Judge Demonstration Script

### Walkthrough A: Demonstrating Blocker Intelligence & Guardrails
1. Open the application at `http://localhost:3000`.
2. On the login screen, select **Scrutiny Officer / Reviewer**.
3. In the Reviewer Queue, open application **`APP-2026-081`** (*Shreya Institute of Technology*).
4. Note that the application is in `deficiency` with 2 active blockers.
5. Click **Advance Stage** and select `Expert Visit Committee (EVC)`. Click **Advance Application**.
6. **Notice the Guardrail:** The system rejects the transition with:
   > *"STAGE ADVANCEMENT PREVENTED BY RULE ENGINE: Transition to Expert Visit Committee (EVC) is blocked by 2 statutory prerequisite(s)."*
7. Switch to the **Evidence Register** tab in the detail drawer.
8. Locate `APH-1.3 - State Government NOC`. Click **Audit**.
9. Change determination from `Deficient / Rejected` to `Verified & Compliant` with note: *"State G.R. authenticated"*. Click **Record Audit Determination**.
10. Notice that the blocker engine dynamically recalculates the state and updates the blocker count!

### Walkthrough B: The Institution Resubmission Flow
1. Click **Sign Out** and log in as **Institution Coordinator**.
2. Notice the top banner alerting about open deficiency notices.
3. Open `APP-2026-081` and click **Resubmit Application**.
4. Enter notes and confirm. The application cleanly returns to `scrutiny` stage for re-evaluation.

### Walkthrough C: Creating a New Application
1. As Institution Coordinator, navigate to **My Applications** and click **Submit New Application**.
2. Fill in the intake wizard (e.g. *B.Tech - Cyber Security*, 60 seats) and click **Submit Application**.
3. Observe that a new application reference is generated, standard APH compliance items (8 items) are initialized, and the application is persisted.

### Walkthrough D: Executive Monitoring & Ageing Analytics
1. Log in as **Administrator**.
2. Examine the **Stage Ageing vs SLA** bar chart showing real-time processing duration benchmarks.
3. Open **Systemic Bottlenecks** to see regional aggregations of delayed cases.
4. Open the **Central Audit Registry** to view timestamped, immutable logs of every action performed.

---

## 🔬 Test Suite & Verification Results

The automated test suite (`tests/run_tests.js`) was executed with the following results:

```
════════════════════════════════════════════════════════════════
AICTE APPROVAL INTELLIGENCE — COMPREHENSIVE AUTOMATED TEST SUITE
════════════════════════════════════════════════════════════════

TEST SUITE 1: Store Initialization & Data Integrity
  [PASS] Store initializes with at least 5 synthetic applications
  [PASS] APP-2026-081 (Shreya Institute) exists in store
  [PASS] APP-2026-081 initial stage is deficiency

TEST SUITE 2: Deterministic Blocker & Dependency Engine
  [PASS] Causal engine flags open blockers on APP-2026-081
  [PASS] Identifies BLOCK-NOC-STATE (State Government NOC prerequisite incomplete)
  [PASS] Identifies BLOCK-FDR-JOINT (Joint Bank FDR prerequisite incomplete)
  [PASS] Blocker explicitly identifies what is blocked (EVC Stage)
  [PASS] Blocker explicitly explains why it is blocked
  [PASS] Blocker identifies incomplete prerequisite
  [PASS] Blocker identifies responsible person/role
  [PASS] Blocker provides next recommended action

TEST SUITE 3: Workflow Guardrail & Illegal Transition Prevention
  [PASS] Blocked invalid stage transition to expert_visit when prerequisites are unmet
  [PASS] Returns informative regulatory rejection rationale

TEST SUITE 4: Prerequisite Resolution & Dynamic Recalculation
  [PASS] Evidence uploaded and set to pending_verification
  [PASS] Scrutiny officer audit marks evidence as Verified
  [PASS] Application successfully resubmitted and moved to Scrutiny stage
  [PASS] Application now legally advances to expert_visit once prerequisite is satisfied
  [PASS] Current stage updated to expert_visit in application record

TEST SUITE 5: Deficiency Notice & Correction Loop
  [PASS] Application returned to Deficiency stage
  [PASS] Deficiency recorded on application record

TEST SUITE 6: Officer & Task Reassignment
  [PASS] Evaluation officer successfully reassigned
  [PASS] Alert task reassigned and updated

TEST SUITE 7: Alert State Engine & Deduplication
  [PASS] Alert acknowledged
  [PASS] Alert resolved

TEST SUITE 8: New Application Intake Creation
  [PASS] New application created with unique ID
  [PASS] Standard regulatory compliance checklist automatically initialized (8 items)
  [PASS] Initial stage is set to submitted

TEST SUITE 9: Browser LocalStorage Persistence Verification
  [PASS] Newly created application persisted across storage read
  [PASS] Application fields verified intact
  [PASS] Comprehensive immutable audit trail recorded and persisted

════════════════════════════════════════════════════════════════
TEST RUN COMPLETE: 30 PASSED, 0 FAILED
════════════════════════════════════════════════════════════════
```

---

## ⚖️ Known Limitations & Future Roadmap

### Prototype Scope & Disclaimers
1. **Synthetic Records:** All institutions, codes, officers, and application numbers are illustrative synthetic data.
2. **No Live Government Integration:** The prototype does not connect to live AICTE databases, DigiLocker, or State Higher Education portals.
3. **Rule-Based Engine:** Blocker diagnosis is driven by deterministic regulatory dependency graphs, not generative machine learning models.

### Future Roadmap for Production
- **Backend & Database:** Swap `store.js` with Python FastAPI and PostgreSQL + SQLAlchemy using the provided repository interfaces.
- **National Single Sign-On (SSO):** Integration with Parichay / MeriPehchaan (National Citizen SSO) for identity verification.
- **Automated Document OCR & Verification:** Integration with DigiLocker and State Land Record APIs (e.g. Mahabhulekh, Bhoomi) for real-time document authenticity verification.
- **Digital Signatures:** eSign / DSC token signing for statutory Letters of Approval (LoA).
