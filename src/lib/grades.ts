import type { GradeClassification } from "@prisma/client";
import type { GradeTier } from "@/lib/calculations";

export function toGradeClassificationEnum(
  tier: GradeTier,
): GradeClassification {
  switch (tier) {
    case "Distinction":
      return "DISTINCTION";
    case "Merit":
      return "MERIT";
    case "Pass":
      return "PASS";
    case "Fail":
      return "FAIL";
  }
}

export function formatGradeClassification(
  classification: GradeClassification,
): GradeTier {
  switch (classification) {
    case "DISTINCTION":
      return "Distinction";
    case "MERIT":
      return "Merit";
    case "PASS":
      return "Pass";
    case "FAIL":
      return "Fail";
  }
}

export type StudentVisibleGrade = {
  id: string;
  assessmentId: string;
  studentId: string;
  isPublished: boolean;
  score: number | null;
  classification: GradeTier | null;
  status: "Published" | "Withheld";
};

export function toStudentVisibleGrade(grade: {
  id: string;
  assessmentId: string;
  studentId: string;
  score: number;
  classification: GradeClassification;
  isPublished: boolean;
}): StudentVisibleGrade {
  if (!grade.isPublished) {
    return {
      id: grade.id,
      assessmentId: grade.assessmentId,
      studentId: grade.studentId,
      isPublished: false,
      score: null,
      classification: null,
      status: "Withheld",
    };
  }

  return {
    id: grade.id,
    assessmentId: grade.assessmentId,
    studentId: grade.studentId,
    isPublished: true,
    score: grade.score,
    classification: formatGradeClassification(grade.classification),
    status: "Published",
  };
}
