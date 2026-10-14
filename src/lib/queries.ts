import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getRoleState, resolveStudentPersonaId } from "@/lib/role";

export const getStudentPickerOptions = cache(async function getStudentPickerOptions() {
  return prisma.student.findMany({
    select: { id: true, studentId: true, fullName: true },
    orderBy: { studentId: "asc" },
  });
});

export const getActiveStudentId = cache(async function getActiveStudentId() {
  const { viewingStudentId } = await getRoleState();
  const students = await getStudentPickerOptions();
  return resolveStudentPersonaId(
    viewingStudentId,
    students.map((student) => student.id),
  );
});
