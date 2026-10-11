# Student Management System — Registry Module

A monolithic Next.js 14+ (App Router) Registry Administration web application built with Prisma ORM and PostgreSQL for the PEN Global technical assessment.

---

## 1. System Architecture & Flow

The system runs as a unified full-stack Next.js monolith. It avoids separate backend microservices or external APIs by executing database mutations directly through Next.js Server Actions and Route Handlers against PostgreSQL via Prisma ORM.

### Architecture Layering

```mermaid
flowchart TB
  subgraph presentation [Presentation Layer]
    RSC[React Server Components]
    Shadcn[shadcn/ui Primitives]
    RoleToggle[Staff / Student Toggle]
  end

  subgraph application [Application and Route Layer]
    SA[Server Actions Mutations and Revalidations]
    Upload[Upload Route Handler]
  end

  subgraph domain [Domain Logic and Helpers]
    Zod[Zod Validations]
    Fees[Financial Ledger Calculations]
    IdGen[Sequential ID Generator]
    Tiers[UK Academic Tier Classifications]
  end

  subgraph dataAccess [Data Access Layer]
    Prisma[Prisma ORM Client Singleton]
  end

  PG[(PostgreSQL Database Real DB State)]
  FS["Local File Storage /public/uploads"]

  presentation --> application
  application --> domain
  domain --> dataAccess
  dataAccess --> PG
  dataAccess --> FS
```



### End-to-End Workflow Flowchart

Matches the assessment’s four Registry workflows. Enrolment unlocks fees and assessments; marksheet follows submissions.

```mermaid
flowchart TB
  Enrol["1. Student Enrolment<br/>SMS-YYYY-XXXX auto ID"]

  subgraph fees [2. Fees and Payments]
    direction LR
    Fee[Programme fee] --> Pay[Record payment] --> Bal[Live balance / Overdue]
  end

  subgraph assess [3. Assessment Submission]
    direction LR
    Create[Staff creates assessment] --> Upload[Student uploads PDF/DOCX] --> Flag[On-time or Late]
  end

  subgraph marks [4. Marksheet and Results]
    direction LR
    Grade[Grade 0-100] --> Tier[Pass / Merit / Distinction]
    Tier --> Toggle{Publish?}
    Toggle -->|Yes| Visible[Marksheet visible]
    Toggle -->|No| Hidden[Result withheld]
  end

  Enrol --> fees
  Enrol --> assess
  assess --> marks
```



---

## 2. Core Workflows & Edge-Case Handling

The application implements deliberate business rules and edge-case protections across the four core Registry workflows:

- **1. Student Enrolment:**
  - Auto-generates sequential Student IDs in the format `SMS-YYYY-XXXX` (e.g., `SMS-2026-0001`) via atomic database counts to eliminate race conditions.
  - Records student details: full name, unique email, date of birth, programme, academic year, and enrolment status.
  - Enforces valid lifecycle statuses: `Enrolled`, `Deferred`, `Withdrawn`, and `Completed`.
  - Provides multi-criteria search and filtering by student name, ID, programme, or status.
- **2. Fees & Payments:**
  - Automatically assigns tuition fees based on the student's enrolled programme.
  - Records payment transactions capturing amount, payment date, and unique reference number.
  - Computes outstanding balance in real time ($$\text{Balance} = \text{Programme Fee} - \sum \text{Payments}$$) rather than relying on mutable stored totals.
  - Surfaces visual overdue badges across the Registry dashboard and fee ledger whenever a student has an outstanding balance.
- **3. Assessment Submission:**
  - Allows staff to create assessments specifying title, module code, and submission deadline.
  - Accepts file uploads restricted to `.pdf` and `.docx` formats.
  - Enforces one active submission per student per assessment while permitting re-submissions prior to the deadline.
  - Evaluates deadlines against server time; late submissions are accepted rather than blocked, but are visually flagged as **Late**.
- **4. Marksheet & Results:**
  - Enables staff to record numeric grades (0–100) per student per assessment.
  - Product decision: automatically applies UK academic classifications — **Pass** (≥40), **Merit** (≥60), **Distinction** (≥70), and **Fail** (<40) — to make marksheet review faster for Registry staff.
  - Provides a per-student **Publish / Withhold** toggle.
  - Strips unpublished scores and tiers at the query layer so students can view their marksheet only once published (never CSS-only hiding).

---

## 3. Role Architecture (Staff vs. Student)

- **Role Toggle:** A synchronous switcher in the top navigation bar allows toggling between **Staff View** and **Student View** without third-party auth complexity.
- **Student Persona Selector:** In Student View, a dropdown lets evaluators inspect the portal from the perspective of any seeded student to verify individual payment and embargo states.
- **Staff Access:** Full management access across enrolment, fees, assessments, marksheet grading, and publishing.
- **Student Access:** Scoped self-service view displaying personal enrolment details, fee balances, assignment uploads, and published marks.

---

## 4. Tech Stack & Constraints Compliance

- **Framework:** Next.js 14+ (App Router, Server Actions, Route Handlers).
- **Database & ORM:** PostgreSQL running with Prisma ORM (`prisma/schema.prisma` committed).
- **UI Components:** Tailwind CSS with shadcn/ui primitives.
- **No External Backend:** Built as a single monolithic Next.js application without Express, NestJS, or external API layers.
- **Real Persistence:** All data operations execute against PostgreSQL; no mock state in `useState`.

---

## 5. Automated Testing (Vitest)

Domain rules are isolated as pure functions in `src/lib/calculations.ts` and covered by automated unit tests:

```bash
pnpm test
```

- **Fee Math:** Validates dynamic balance deductions and overdue boolean flags across full, partial, and zero-payment accounts.
- **Classification Tiers:** Verifies exact boundary values (39 Fail vs 40 Pass; 59 Pass vs 60 Merit; 69 Merit vs 70 Distinction).
- **Deadline Verification:** Validates server timestamp comparisons for on-time and late submissions.
- **ID Formatting:** Verifies regex structure for `SMS-YYYY-XXXX` identifiers.

---

## 6. AI Usage & Governance

In alignment with the assessment guidelines, AI tools were utilized to accelerate delivery while maintaining architectural control:

- **Scaffolding:** Rapid generation of initial Prisma relations, Zod validation schemas, and UI table structures.
- **Seed Synthesis:** Production of realistic synthetic records for cohorts, fee structures, and submission timelines.
- **Agent Directives (`AI_DIRECTIVES.md`):** A dedicated directives file was maintained in the project root to restrict the AI from proposing separate backends, enforce real database persistence, and guarantee edge-case rules.
- **Human Ownership:** All database transactions, real-time balance aggregations, server deadline checks, and grade embargo query protections were audited and validated manually.

---

## 7. Local Setup & Installation

### Prerequisites

- Node.js 20.19+ (or 22.12+)
- pnpm
- A PostgreSQL instance (Docker, Neon/Supabase, or the bundled embedded helper)

### Setup Instructions

1. **Clone the repository:**
  ```bash
   git clone https://github.com/jorjishasan/sms-registry-module.git
   cd sms-registry-module
  ```
2. **Install dependencies:**
  ```bash
   pnpm install
  ```
3. **Configure Environment Variables:**
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   Set your PostgreSQL connection string in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/sms_registry?schema=public"
   ```
   Without a local Postgres install, start the embedded helper in a separate terminal (writes `.env` automatically):
   ```bash
   pnpm db:pg
   ```
4. **Initialize Database & Seed Records:**
   Apply migrations and load demo data:
   ```bash
   pnpm exec prisma migrate dev
   pnpm db:seed
   ```
5. **Start the Development Server:**
   ```bash
   pnpm dev
   ```
   Open `http://localhost:3000` in your browser.
6. **Run domain unit tests:**
   ```bash
   pnpm test
   ```

---

## 8. Seed Data Overview

Running `npx prisma db seed` loads a comprehensive demo dataset:

- **2 Academic Programmes:** Computer Science BSc (£9,250 base fee) and Data Science MSc (£12,000 base fee).
- **5 Student Profiles:** Formatted IDs (`SMS-2026-0001` to `SMS-2026-0005`) covering `Enrolled`, `Deferred`, `Withdrawn`, and `Completed` statuses.
- **Fee Ledgers:** Seeded cases for fully paid (£0 balance), partial payments with active overdue badges, and unbilled accounts.
- **Assessments & Submissions:** Open and closed deadlines with attached sample `.pdf` / `.docx` files, including late and on-time submissions.
- **Grading States:** Sample grades spanning Pass, Merit, and Distinction tiers, with both published and withheld statuses to demonstrate result embargoes.

