"use server";

import { revalidatePath } from "next/cache";
import { allocateStudentId } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import { createStudentSchema } from "@/lib/validations";

export type ActionResult = {
  success: boolean;
  message: string;
};

export async function createStudent(
  input: unknown,
): Promise<ActionResult> {
  const parsed = createStudentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid student data",
    };
  }

  const data = parsed.data;
  const year = Number(data.academicYear.slice(0, 4)) || new Date().getFullYear();

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.student.findMany({
        where: { studentId: { startsWith: `SMS-${year}-` } },
        select: { studentId: true },
      });

      const studentId = allocateStudentId(
        existing.map((row) => row.studentId),
        year,
      );

      await tx.student.create({
        data: {
          studentId,
          fullName: data.fullName,
          email: data.email.toLowerCase(),
          dateOfBirth: new Date(data.dateOfBirth),
          academicYear: data.academicYear,
          status: data.status,
          programmeId: data.programmeId,
        },
      });
    });

    revalidatePath("/students");
    revalidatePath("/");
    revalidatePath("/fees");

    return { success: true, message: "Student enrolled successfully" };
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "A student with this email already exists"
        : "Failed to enrol student";
    return { success: false, message };
  }
}
