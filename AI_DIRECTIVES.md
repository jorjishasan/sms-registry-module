# AI Engineering Directives & Architectural Guardrails
**Project:** Student Management System — Registry Module  
**Architecture:** Monolithic Next.js 14+ (App Router), PostgreSQL, Prisma ORM  

---

## 1. Purpose & Governance Philosophy

This document defines the strict architectural boundaries, domain invariants, and edge-case rules enforced on AI coding agents during the development of the Registry Module. 

Rather than using AI for unconstrained code generation, the agent operates under **Specification-Driven Development (SDD)**:
1. **Schema & Invariant Lock:** Relational constraints and financial/academic rules are defined first.
2. **Pure Domain Isolation:** Business calculations are decoupled from UI state and verified via unit tests.
3. **Zero-Trust Server Enforcement:** Deadlines, balances, and grade embargoes are enforced strictly on the server layer.

---

## 2. Non-Negotiable Technical Constraints

The AI agent MUST adhere to the following hard constraints at all times:

* **Monolithic Next.js Backend Only:** All backend mutations and queries must execute inside Next.js Server Actions (`src/actions/`) or App Router Route Handlers (`src/app/api/`). Never scaffold external backend frameworks (Express, NestJS, FastAPI).
* **Real Database Persistence:** Every read and write operation must persist to PostgreSQL via Prisma ORM. Never mock application state using client-side `useState`, `localStorage`, or static in-memory arrays.
* **Zero-Config Role Switching:** Do not implement heavyweight third-party authentication (NextAuth, Clerk). Implement a synchronous cookie-backed Staff / Student role switch supporting **Staff View** and **Student View**, paired with an active **Student Persona Switcher** so evaluators can inspect the Student Portal from any seeded student's perspective.
* **Credential Hygiene:** Never hardcode database URLs or secrets. Always reference `process.env.DATABASE_URL` and maintain a clean `.env.example`.

---

## 3. Core Registry Workflows & Edge-Case Invariants

### Workflow 1: Student Enrolment
* **Required Fields:** Full name, unique email, date of birth, assigned programme, academic year, and enrolment status.
* **Deterministic ID Generation:** Auto-generate sequential Student IDs in the format `SMS-YYYY-XXXX` (e.g., `SMS-2026-0001`). Derive the next sequence number atomically from the database to prevent duplicate key collisions.
* **Valid Lifecycle Statuses:** Strictly enforce enum/union values: `Enrolled`, `Deferred`, `Withdrawn`, `Completed`.
* **Registry Search & Filtering:** Implement multi-criteria filtering by student name, Student ID, programme, and enrolment status.

### Workflow 2: Fees & Payments Ledger
* **Programme Fee Assignment:** Each student inherits their base tuition fee from their enrolled `Programme`.
* **Immutable Payment Records:** Record individual transactions with `amount`, `paymentDate`, and a unique `referenceNumber`.
* **Dynamic Real-Time Balance:** Never store a mutable `balance` column that can drift out of sync. Compute `outstandingBalance` dynamically at query/domain time:
  `outstandingBalance = Math.max(0, programme.baseFee - SUM(payments.amount))`
* **Overdue Balance Flagging:** Automatically flag any student with `outstandingBalance > 0` (or explicit overdue status) and surface these accounts prominently on the Registry Dashboard and Fees Ledger.

### Workflow 3: Assessment Submissions
* **Assessment Creation (Staff):** Staff define `title`, `moduleCode`, and `deadline` (timestamp).
* **File Upload Constraints (Student):** Accept only `.pdf` and `.docx` files via multipart Route Handler (`POST /api/upload`), storing files locally in `/public/uploads/` for zero-config local evaluation.
* **Single Active Submission & Pre-Deadline Resubmission:** Enforce a composite unique constraint `@@unique([assessmentId, studentId])`.
  * If `serverNow <= assessment.deadline`: Allow students to resubmit (overwriting/updating their previous submission record).
  * If `serverNow > assessment.deadline` and a submission already exists: Block post-deadline overwrites.
* **Late Submission Edge Case:** If a student submits for the first time after `assessment.deadline`, **accept the submission** (never lock out a student from submitting work), set `isLate = true` based on server time, and render a prominent `Late` warning badge in the UI.

### Workflow 4: Marksheet & Results Embargo
* **Numeric Grading:** Staff enter integer grades strictly bounded between `0` and `100`.
* **Automatic Academic Classification:**
  * `score >= 70` -> **Distinction**
  * `score >= 60` -> **Merit**
  * `score >= 40` -> **Pass**
  * `score < 40`  -> **Fail**
* **Publication Embargo (Data Leak Prevention):** Staff can toggle `isPublished` (`true` / `false`) per student result.
  * **Security Rule:** When rendering the Student View or returning student-scoped data, if `isPublished === false`, the server layer MUST strip `score` and `classification` (returning `null` / `"Withheld"`). Never send unpublished grades to the client and hide them purely with CSS.

---

## 4. UI / UX Design System Rules

* **Visual Direction:** High-density operational SaaS interface (Slate/Zinc neutral surfaces, crisp 1px borders, zero decorative clutter).
* **Tabular Data Alignment:** Apply `font-mono tabular-nums` to all Student IDs (`SMS-YYYY-XXXX`), currency figures (`£`), payment reference codes, timestamps, and numeric marks (`0-100`).
* **Semantic Status Badging:**
  * **Emerald (Success):** `Enrolled`, `Completed`, `Paid (£0.00)`, `On-Time`, `Published`, `Distinction` / `Merit` / `Pass`.
  * **Amber (Warning):** `Deferred`, `Partial Payment`, `Withheld (Draft)`.
  * **Rose (Destructive):** `Withdrawn`, `Overdue Balance`, `Late Submission`, `Fail (<40)`.

---

## 5. Automated Testing & Verification Protocol

1. **Pure Domain Layer (`src/lib/calculations.ts`):** All fee math, grade boundary classifications, ID formatting, and deadline comparisons must be written as pure TypeScript functions with zero database or React dependencies.
2. **Unit Test Coverage (`tests/calculations.test.ts`):** Maintain Vitest unit tests verifying:
   * Partial, full, and zero-payment balance calculations and overdue flags.
   * Exact grade classification boundary values (`39`, `40`, `59`, `60`, `69`, `70`, and out-of-range rejection).
   * Server timestamp comparisons for on-time (`<= deadline`) vs. late (`> deadline`) submissions.
   * Sequential Student ID formatting (`SMS-YYYY-XXXX`).
3. **Seed Data Completeness (`prisma/seed.ts`):** The seed script must deterministically populate at least 2 programmes, 5+ students across varied enrolment statuses, partial/full/overdue fee ledgers, open and past-deadline assessments, on-time and late submissions, and both published and withheld grades.