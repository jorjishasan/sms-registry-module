"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  ROLE_COOKIE,
  STUDENT_PERSONA_COOKIE,
  type AppRole,
} from "@/lib/role";
import { prisma } from "@/lib/prisma";

export async function setRole(role: AppRole) {
  const cookieStore = await cookies();
  cookieStore.set(ROLE_COOKIE, role, {
    path: "/",
    sameSite: "lax",
  });

  if (role === "student") {
    const current = cookieStore.get(STUDENT_PERSONA_COOKIE)?.value;
    if (!current) {
      const first = await prisma.student.findFirst({
        orderBy: { studentId: "asc" },
        select: { id: true },
      });
      if (first) {
        cookieStore.set(STUDENT_PERSONA_COOKIE, first.id, {
          path: "/",
          sameSite: "lax",
        });
      }
    }
  }

  revalidatePath("/", "layout");
}

export async function setViewingStudent(studentId: string) {
  const cookieStore = await cookies();
  cookieStore.set(STUDENT_PERSONA_COOKIE, studentId, {
    path: "/",
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
