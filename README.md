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

## 2. Covering Necessary Edge Cases/Feat not including in the PDF

1. **Students can delete a submitted file before the deadline.** *{A student may want to refine the work and upload it again. Until then, staff cannot view the earlier file.}*
2. **Staff can edit or extend a deadline.** *{Staff keep control of the submission date when a deadline needs to change.}*
3. **PDF and Word files open in the app.** *{Students and staff can read a submission without downloading it first.}*
4. **Payment references can be generated.** *{The next free `PAY-YYYY-XXXX` is filled in, so the reference stays unique without being typed by hand.}*

---

## 3. Core Workflows

**Enrolment.** A student record stores name, email, date of birth, programme, academic year, and status (`Enrolled`, `Deferred`, `Withdrawn`, `Completed`). The ID is `SMS-YYYY-XXXX`. Staff can search by name, ID, programme, or status.

**Fees.** The fee comes from the programme. Payments store amount, date, and a unique reference. Balance is `fee − payments`, and any remainder is overdue on the dashboard and the ledger.

**Assessments.** Staff set a title, module, and deadline. Students upload one PDF or DOCX, and may replace it before the deadline. A first upload after the deadline is still accepted and marked Late.

**Marksheet.** Staff enter 0–100. The tier is Pass (≥40), Merit (≥60), Distinction (≥70), or Fail. Each result can be published or withheld. Unpublished scores never reach the student view.

---

## 4. Role Architecture (Staff vs. Student)

- **Role Toggle:** A synchronous switcher in the top navigation bar allows toggling between **Staff View** and **Student View** without third-party auth complexity.
- **Student Persona Selector:** In Student View, a dropdown lets evaluators inspect the portal from the perspective of any seeded student to verify individual payment and embargo states.
- **Staff Access:** Full management access across enrolment, fees, assessments, marksheet grading, and publishing.
- **Student Access:** Scoped self-service view displaying personal enrolment details, fee balances, assignment uploads, and published marks.

---

## 5. Tech Stack & Constraints Compliance

- **Framework:** Next.js 14+ (App Router, Server Actions, Route Handlers).
- **Database & ORM:** PostgreSQL running with Prisma ORM (`prisma/schema.prisma` committed).
- **UI Components:** Tailwind CSS with shadcn/ui primitives.
- **No External Backend:** Built as a single monolithic Next.js application without Express, NestJS, or external API layers.
- **Real Persistence:** All data operations execute against PostgreSQL; no mock state in `useState`.

---

## 6. Automated Testing (Vitest)

Domain rules are isolated as pure functions in `src/lib/calculations.ts` and covered by automated unit tests:

```bash
pnpm test
```

- **Fee math:** full, partial, zero, and overpayment balances, including the overdue flag.
- **Tiers:** boundaries at 39, 40, 59, 60, 69, 70, and 100, plus rejected scores.
- **Deadlines:** on time at or before the deadline; late after it. A first upload is still allowed after the deadline; replace and remove are not.
- **IDs:** `SMS-YYYY-XXXX` and `PAY-YYYY-XXXX`, including the lowest free number.
- **Embargo:** a withheld grade returns no score or tier; a published grade does.
- **File labels:** generated upload names display as the document name.

---

## 7. AI Usage & Governance

AI was used to scaffold Prisma models, Zod schemas, seed records, and UI structure. `AI_DIRECTIVES.md` kept the work on one Next.js app, a real database, and the deadline, balance, and embargo rules. Transactions, balances, deadline checks, and withheld grades were reviewed by hand.

---

## 8. Local Setup & Installation

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
4. **Initialize the database and load demo data:**
   ```bash
   pnpm exec prisma migrate dev
   pnpm db:seed
   ```
   `pnpm db:seed` replaces the demo rows. `pnpm db:reset` rebuilds the schema and seeds again.
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

## 9. Seed Data Overview

Running `pnpm db:seed` loads:

- **2 programmes:** Computer Science BSc (£9,250) and Data Science MSc (£12,000).
- **5 students:** `SMS-2026-0001`–`0005`, covering Enrolled, Deferred, Withdrawn, and Completed.
- **Fees:** one settled account, one partial payment, and one with nothing paid.
- **Assessments:** one open deadline and three closed ones, with on-time and late PDF/DOCX submissions.
- **Grades:** Pass, Merit, Distinction, and Fail, both published and withheld.

