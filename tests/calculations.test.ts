import { describe, expect, it } from "vitest";
import {
  allocatePaymentReference,
  allocateStudentId,
  calculateFeeSummary,
  checkIsLate,
  generateNextStudentId,
  getGradeClassification,
  isPastDeadline,
} from "../src/lib/calculations";

describe("calculateFeeSummary", () => {
  it("marks a fully paid account as settled", () => {
    const summary = calculateFeeSummary(9250, [{ amount: 5000 }, { amount: 4250 }]);
    expect(summary.totalPaid).toBe(9250);
    expect(summary.outstandingBalance).toBe(0);
    expect(summary.isOverdue).toBe(false);
  });

  it("flags partial payments as overdue with remaining balance", () => {
    const summary = calculateFeeSummary(9250, [{ amount: 2000 }]);
    expect(summary.totalPaid).toBe(2000);
    expect(summary.outstandingBalance).toBe(7250);
    expect(summary.isOverdue).toBe(true);
  });

  it("treats zero payments as fully overdue", () => {
    const summary = calculateFeeSummary(12000, []);
    expect(summary.totalPaid).toBe(0);
    expect(summary.outstandingBalance).toBe(12000);
    expect(summary.isOverdue).toBe(true);
  });

  it("never returns a negative outstanding balance", () => {
    const summary = calculateFeeSummary(1000, [{ amount: 1500 }]);
    expect(summary.outstandingBalance).toBe(0);
    expect(summary.isOverdue).toBe(false);
  });
});

describe("getGradeClassification", () => {
  it("classifies exact UK academic boundaries", () => {
    expect(getGradeClassification(39)).toBe("Fail");
    expect(getGradeClassification(40)).toBe("Pass");
    expect(getGradeClassification(59)).toBe("Pass");
    expect(getGradeClassification(60)).toBe("Merit");
    expect(getGradeClassification(69)).toBe("Merit");
    expect(getGradeClassification(70)).toBe("Distinction");
    expect(getGradeClassification(100)).toBe("Distinction");
    expect(getGradeClassification(0)).toBe("Fail");
  });

  it("rejects out-of-range scores", () => {
    expect(() => getGradeClassification(-1)).toThrow(/0 and 100/);
    expect(() => getGradeClassification(101)).toThrow(/0 and 100/);
    expect(() => getGradeClassification(40.5)).toThrow(/0 and 100/);
  });
});

describe("isPastDeadline / checkIsLate", () => {
  const deadline = new Date("2026-06-01T17:00:00.000Z");

  it("treats moments at or before the deadline as not past", () => {
    expect(isPastDeadline(new Date("2026-06-01T17:00:00.000Z"), deadline)).toBe(
      false,
    );
    expect(isPastDeadline(new Date("2026-05-31T23:59:59.000Z"), deadline)).toBe(
      false,
    );
    expect(checkIsLate(new Date("2026-06-01T17:00:00.000Z"), deadline)).toBe(
      false,
    );
  });

  it("flags moments after the deadline as past / late", () => {
    expect(isPastDeadline(new Date("2026-06-01T17:00:01.000Z"), deadline)).toBe(
      true,
    );
    expect(checkIsLate(new Date("2026-06-01T17:00:01.000Z"), deadline)).toBe(
      true,
    );
  });
});

describe("allocateStudentId", () => {
  it("picks the lowest unused sequence for the year", () => {
    expect(
      allocateStudentId(
        ["SMS-2026-0001", "SMS-2026-0003"],
        2026,
      ),
    ).toBe("SMS-2026-0002");
  });

  it("pads four digits below 10000 and expands after", () => {
    expect(allocateStudentId([], 2026)).toBe("SMS-2026-0001");
    expect(
      allocateStudentId(
        Array.from({ length: 9999 }, (_, i) =>
          `SMS-2026-${String(i + 1).padStart(4, "0")}`,
        ),
        2026,
      ),
    ).toBe("SMS-2026-10000");
  });
});

describe("generateNextStudentId", () => {
  it("formats sequential SMS-YYYY-XXXX identifiers", () => {
    expect(generateNextStudentId(0, 2026)).toBe("SMS-2026-0001");
    expect(generateNextStudentId(4, 2026)).toBe("SMS-2026-0005");
    expect(generateNextStudentId(99, 2025)).toBe("SMS-2025-0100");
  });
});

describe("allocatePaymentReference", () => {
  it("fills gaps in PAY-YYYY-XXXX references", () => {
    expect(
      allocatePaymentReference(["PAY-2026-0001", "PAY-2026-0003"], 2026),
    ).toBe("PAY-2026-0002");
  });
});
