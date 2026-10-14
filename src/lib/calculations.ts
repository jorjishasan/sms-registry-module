export type PaymentAmount = {
  amount: number;
};

export type FeeSummary = {
  totalPaid: number;
  outstandingBalance: number;
  isOverdue: boolean;
};

export type GradeTier = "Distinction" | "Merit" | "Pass" | "Fail";

export function calculateFeeSummary(
  baseFee: number,
  payments: PaymentAmount[],
): FeeSummary {
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const outstandingBalance = Math.max(0, baseFee - totalPaid);
  const isOverdue = outstandingBalance > 0;

  return { totalPaid, outstandingBalance, isOverdue };
}

export function getGradeClassification(score: number): GradeTier {
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error("Score must be an integer between 0 and 100 inclusive");
  }

  if (score >= 70) return "Distinction";
  if (score >= 60) return "Merit";
  if (score >= 40) return "Pass";
  return "Fail";
}

/** True when `moment` is strictly after the submission deadline. */
export function isPastDeadline(moment: Date, deadline: Date): boolean {
  return moment.getTime() > deadline.getTime();
}

export function checkIsLate(submittedAt: Date, deadline: Date): boolean {
  return isPastDeadline(submittedAt, deadline);
}

/** Uploads and removals stop once the deadline has passed. */
export function canModifySubmission(now: Date, deadline: Date): boolean {
  return !isPastDeadline(now, deadline);
}

export function formatStudentSequence(n: number): string {
  if (n >= 10000) return String(n);
  return String(n).padStart(4, "0");
}

export function allocateStudentId(existingIds: string[], year: number): string {
  const prefix = `SMS-${year}-`;
  const used = new Set<number>();

  for (const id of existingIds) {
    if (!id.startsWith(prefix)) continue;
    const suffix = id.slice(prefix.length);
    const parsed = Number.parseInt(suffix, 10);
    if (!Number.isNaN(parsed)) used.add(parsed);
  }

  let candidate = 1;
  while (used.has(candidate)) candidate += 1;

  return `${prefix}${formatStudentSequence(candidate)}`;
}

/** @deprecated Use allocateStudentId with IDs loaded from the database. */
export function generateNextStudentId(
  existingCount: number,
  year: number,
): string {
  return allocateStudentId(
    Array.from({ length: existingCount }, (_, index) =>
      `SMS-${year}-${formatStudentSequence(index + 1)}`,
    ),
    year,
  );
}

export function formatPaymentSequence(n: number): string {
  if (n >= 10000) return String(n);
  return String(n).padStart(4, "0");
}

export function allocatePaymentReference(
  existingRefs: string[],
  year: number,
): string {
  const prefix = `PAY-${year}-`;
  const used = new Set<number>();

  for (const ref of existingRefs) {
    const normalized = ref.trim().toUpperCase();
    if (!normalized.startsWith(prefix)) continue;
    const parsed = Number.parseInt(normalized.slice(prefix.length), 10);
    if (!Number.isNaN(parsed)) used.add(parsed);
  }

  let candidate = 1;
  while (used.has(candidate)) candidate += 1;

  return `${prefix}${formatPaymentSequence(candidate)}`;
}
