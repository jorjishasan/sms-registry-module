import { cache } from "react";
import { cookies } from "next/headers";

export type AppRole = "staff" | "student";

export const ROLE_COOKIE = "sms_role";
export const STUDENT_PERSONA_COOKIE = "sms_student_id";

export const getRoleState = cache(async function getRoleState(): Promise<{
  role: AppRole;
  viewingStudentId: string | null;
}> {
  const cookieStore = await cookies();
  const roleValue = cookieStore.get(ROLE_COOKIE)?.value;
  const role: AppRole = roleValue === "student" ? "student" : "staff";
  const viewingStudentId =
    cookieStore.get(STUDENT_PERSONA_COOKIE)?.value ?? null;

  return { role, viewingStudentId };
});

export async function resolveStudentPersonaId(
  preferredId: string | null,
  fallbackIds: string[],
): Promise<string | null> {
  if (preferredId && fallbackIds.includes(preferredId)) {
    return preferredId;
  }
  return fallbackIds[0] ?? null;
}
