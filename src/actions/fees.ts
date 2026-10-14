"use server";

import { revalidatePath } from "next/cache";
import { allocatePaymentReference } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import { recordPaymentSchema } from "@/lib/validations";
import type { ActionResult } from "@/actions/students";

export async function recordPayment(input: unknown): Promise<ActionResult> {
  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid payment data",
    };
  }

  const data = parsed.data;

  try {
    await prisma.payment.create({
      data: {
        studentId: data.studentId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        referenceNumber: data.referenceNumber.trim().toUpperCase(),
      },
    });

    revalidatePath("/fees");
    revalidatePath("/");

    return { success: true, message: "Payment recorded successfully" };
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "Reference number must be unique"
        : "Failed to record payment";
    return { success: false, message };
  }
}

export async function suggestPaymentReference(
  paymentDateIso: string,
): Promise<{ success: true; reference: string } | { success: false; message: string }> {
  const year = Number(paymentDateIso.slice(0, 4)) || new Date().getFullYear();

  try {
    const existing = await prisma.payment.findMany({
      where: { referenceNumber: { startsWith: `PAY-${year}-` } },
      select: { referenceNumber: true },
    });

    const reference = allocatePaymentReference(
      existing.map((row) => row.referenceNumber),
      year,
    );

    return { success: true, reference };
  } catch {
    return { success: false, message: "Could not generate reference" };
  }
}
