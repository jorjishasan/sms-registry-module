import { z } from "zod";

export const createStudentSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().email("Valid email is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  programmeId: z.string().min(1, "Programme is required"),
  academicYear: z.string().trim().min(4, "Academic year is required"),
  status: z.enum(["ENROLLED", "DEFERRED", "WITHDRAWN", "COMPLETED"]),
});

export const recordPaymentSchema = z.object({
  studentId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  paymentDate: z.string().min(1, "Payment date is required"),
  referenceNumber: z
    .string()
    .trim()
    .min(3, "Reference number is required")
    .max(64),
});

export const createAssessmentSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  moduleCode: z.string().trim().min(2, "Module code is required"),
  deadline: z.string().min(1, "Deadline is required"),
});

export const extendDeadlineSchema = z.object({
  assessmentId: z.string().min(1),
  deadline: z.string().min(1, "Deadline is required"),
});

export const saveGradeSchema = z.object({
  assessmentId: z.string().min(1),
  studentId: z.string().min(1),
  score: z.coerce.number().int().min(0).max(100),
});

export const togglePublishSchema = z.object({
  gradeId: z.string().min(1),
  isPublished: z.boolean(),
});
