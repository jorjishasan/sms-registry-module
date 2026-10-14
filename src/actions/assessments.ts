"use server";

import { revalidatePath } from "next/cache";
import { checkIsLate } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import {
  createAssessmentSchema,
  extendDeadlineSchema,
} from "@/lib/validations";
import type { ActionResult } from "@/actions/students";

export async function createAssessment(input: unknown): Promise<ActionResult> {
  const parsed = createAssessmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid assessment data",
    };
  }

  const data = parsed.data;

  try {
    await prisma.assessment.create({
      data: {
        title: data.title,
        moduleCode: data.moduleCode.toUpperCase(),
        deadline: new Date(data.deadline),
      },
    });

    revalidatePath("/assessments");
    revalidatePath("/marksheet");

    return { success: true, message: "Assessment created successfully" };
  } catch {
    return { success: false, message: "Failed to create assessment" };
  }
}

export async function extendAssessmentDeadline(
  input: unknown,
): Promise<ActionResult> {
  const parsed = extendDeadlineSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid deadline",
    };
  }

  const { assessmentId, deadline } = parsed.data;
  const nextDeadline = new Date(deadline);

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { id: true },
    });

    if (!assessment) {
      return { success: false, message: "Assessment not found" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.assessment.update({
        where: { id: assessmentId },
        data: { deadline: nextDeadline },
      });

      const submissions = await tx.submission.findMany({
        where: { assessmentId },
        select: { id: true, submittedAt: true },
      });

      for (const submission of submissions) {
        await tx.submission.update({
          where: { id: submission.id },
          data: {
            isLate: checkIsLate(submission.submittedAt, nextDeadline),
          },
        });
      }
    });

    revalidatePath("/assessments");
    revalidatePath("/marksheet");

    return { success: true, message: "Deadline updated" };
  } catch {
    return { success: false, message: "Failed to update deadline" };
  }
}
