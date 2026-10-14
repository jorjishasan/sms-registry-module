import "dotenv/config";
import { PrismaClient, GradeClassification, StudentStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function ensureSampleFiles() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const samples = [
    {
      name: "sms-2026-0001-cs101-essay.pdf",
      content: "%PDF-1.4\n% Sample on-time submission for SMS Registry seed\n",
    },
    {
      name: "sms-2026-0002-cs101-essay.pdf",
      content: "%PDF-1.4\n% Sample late submission for SMS Registry seed\n",
    },
    {
      name: "sms-2026-0001-ds201-report.docx",
      content: "PK\u0003\u0004 sample docx placeholder for SMS Registry seed",
    },
  ];

  for (const sample of samples) {
    await writeFile(path.join(uploadsDir, sample.name), sample.content, "utf8");
  }

  return samples;
}

async function main() {
  await ensureSampleFiles();

  await prisma.grade.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.programme.deleteMany();

  const cs = await prisma.programme.create({
    data: {
      code: "CS-BSC",
      name: "Computer Science BSc",
      baseFee: 9250,
    },
  });

  const ds = await prisma.programme.create({
    data: {
      code: "DS-MSC",
      name: "Data Science MSc",
      baseFee: 12000,
    },
  });

  const students = await Promise.all([
    prisma.student.create({
      data: {
        studentId: "SMS-2026-0001",
        fullName: "Amina Rahman",
        email: "amina.rahman@student.sms.ac.uk",
        dateOfBirth: new Date("2003-04-12"),
        academicYear: "2025/26",
        status: StudentStatus.ENROLLED,
        programmeId: cs.id,
      },
    }),
    prisma.student.create({
      data: {
        studentId: "SMS-2026-0002",
        fullName: "James Okafor",
        email: "james.okafor@student.sms.ac.uk",
        dateOfBirth: new Date("2002-11-03"),
        academicYear: "2025/26",
        status: StudentStatus.ENROLLED,
        programmeId: cs.id,
      },
    }),
    prisma.student.create({
      data: {
        studentId: "SMS-2026-0003",
        fullName: "Sofia Mendes",
        email: "sofia.mendes@student.sms.ac.uk",
        dateOfBirth: new Date("2001-07-21"),
        academicYear: "2025/26",
        status: StudentStatus.DEFERRED,
        programmeId: ds.id,
      },
    }),
    prisma.student.create({
      data: {
        studentId: "SMS-2026-0004",
        fullName: "Liam Chen",
        email: "liam.chen@student.sms.ac.uk",
        dateOfBirth: new Date("2000-01-18"),
        academicYear: "2024/25",
        status: StudentStatus.WITHDRAWN,
        programmeId: cs.id,
      },
    }),
    prisma.student.create({
      data: {
        studentId: "SMS-2026-0005",
        fullName: "Priya Shah",
        email: "priya.shah@student.sms.ac.uk",
        dateOfBirth: new Date("1999-09-09"),
        academicYear: "2023/24",
        status: StudentStatus.COMPLETED,
        programmeId: ds.id,
      },
    }),
  ]);

  const [amina, james, sofia] = students;

  // Student 1 fully paid
  await prisma.payment.createMany({
    data: [
      {
        studentId: amina.id,
        amount: 5000,
        paymentDate: new Date("2025-10-01"),
        referenceNumber: "PAY-2025-0001",
      },
      {
        studentId: amina.id,
        amount: 4250,
        paymentDate: new Date("2026-01-15"),
        referenceNumber: "PAY-2026-0002",
      },
    ],
  });

  // Student 2 partially paid (overdue)
  await prisma.payment.create({
    data: {
      studentId: james.id,
      amount: 2500,
      paymentDate: new Date("2025-11-20"),
      referenceNumber: "PAY-2025-0003",
    },
  });

  // Student 3: zero payments (overdue) — intentional empty ledger

  const openAssessment = await prisma.assessment.create({
    data: {
      title: "Algorithms Coursework",
      moduleCode: "CS101",
      deadline: new Date("2026-12-15T17:00:00.000Z"),
    },
  });

  const closedAssessment = await prisma.assessment.create({
    data: {
      title: "Data Modelling Report",
      moduleCode: "DS201",
      deadline: new Date("2026-01-10T17:00:00.000Z"),
    },
  });

  await prisma.assessment.createMany({
    data: [
      {
        title: "Network Security Brief",
        moduleCode: "NET401",
        deadline: new Date("2026-02-01T17:00:00.000Z"),
      },
      {
        title: "Business Ethics Essay",
        moduleCode: "BUS301",
        deadline: new Date("2025-11-01T17:00:00.000Z"),
      },
    ],
  });

  await prisma.submission.createMany({
    data: [
      {
        assessmentId: closedAssessment.id,
        studentId: amina.id,
        fileName: "sms-2026-0001-ds201-report.docx",
        fileUrl: "/uploads/sms-2026-0001-ds201-report.docx",
        submittedAt: new Date("2026-01-09T14:00:00.000Z"),
        isLate: false,
      },
      {
        assessmentId: closedAssessment.id,
        studentId: james.id,
        fileName: "sms-2026-0002-cs101-essay.pdf",
        fileUrl: "/uploads/sms-2026-0002-cs101-essay.pdf",
        submittedAt: new Date("2026-01-12T10:30:00.000Z"),
        isLate: true,
      },
      {
        assessmentId: openAssessment.id,
        studentId: amina.id,
        fileName: "sms-2026-0001-cs101-essay.pdf",
        fileUrl: "/uploads/sms-2026-0001-cs101-essay.pdf",
        submittedAt: new Date("2026-03-01T09:00:00.000Z"),
        isLate: false,
      },
    ],
  });

  await prisma.grade.createMany({
    data: [
      {
        assessmentId: closedAssessment.id,
        studentId: amina.id,
        score: 78,
        classification: GradeClassification.DISTINCTION,
        isPublished: true,
      },
      {
        assessmentId: closedAssessment.id,
        studentId: james.id,
        score: 62,
        classification: GradeClassification.MERIT,
        isPublished: true,
      },
      {
        assessmentId: closedAssessment.id,
        studentId: sofia.id,
        score: 45,
        classification: GradeClassification.PASS,
        isPublished: false,
      },
      {
        assessmentId: openAssessment.id,
        studentId: james.id,
        score: 28,
        classification: GradeClassification.FAIL,
        isPublished: false,
      },
    ],
  });

  console.log("Seed complete:");
  console.log("- 2 programmes");
  console.log("- 5 students (SMS-2026-0001 … 0005)");
  console.log("- fee ledgers: full / partial overdue / zero payments");
  console.log("- 4 assessments (1 open, 3 closed)");
  console.log("- on-time and late submissions");
  console.log("- published and withheld grades across Distinction/Merit/Pass/Fail");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
