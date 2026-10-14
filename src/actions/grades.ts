"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getGradeClassification } from "@/lib/calculations";
import { toGradeClassificationEnum } from "@/lib/grades";
import { saveGradeSchema, togglePublishSchema } from "@/lib/validations";
import type { ActionResult } from "@/actions/students";

export async function saveGrade(input: unknown): Promise<ActionResult> {
  const parsed = saveGradeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid grade data",
    };
  }

  const data = parsed.data;

  try {
    const tier = getGradeClassification(data.score);
    const classification = toGradeClassificationEnum(tier);

    await prisma.grade.upsert({
      where: {
        assessmentId_studentId: {
          assessmentId: data.assessmentId,
          studentId: data.studentId,
        },
      },
      create: {
        assessmentId: data.assessmentId,
        studentId: data.studentId,
        score: data.score,
        classification,
        isPublished: false,
      },
      update: {
        score: data.score,
        classification,
      },
    });

    revalidatePath("/marksheet");
    revalidatePath("/");

    return { success: true, message: `Grade saved (${tier})` };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save grade";
    return { success: false, message };
  }
}

export async function togglePublishGrade(
  input: unknown,
): Promise<ActionResult> {
  const parsed = togglePublishSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid publish toggle",
    };
  }

  try {
    await prisma.grade.update({
      where: { id: parsed.data.gradeId },
      data: { isPublished: parsed.data.isPublished },
    });

    revalidatePath("/marksheet");
    revalidatePath("/");

    return {
      success: true,
      message: parsed.data.isPublished
        ? "Grade published"
        : "Grade withheld",
    };
  } catch {
    return { success: false, message: "Failed to update publication state" };
  }
}
