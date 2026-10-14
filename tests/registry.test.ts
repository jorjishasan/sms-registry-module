import { describe, expect, it } from "vitest";
import { documentFileLabel } from "../src/lib/format";
import { toStudentVisibleGrade } from "../src/lib/grades";

describe("documentFileLabel", () => {
  it("drops the generated student prefix and keeps the document name", () => {
    expect(documentFileLabel("sms-2026-0002-cs101-essay.pdf")).toBe(
      "cs101-essay.pdf",
    );
  });

  it("leaves an unrecognised name unchanged", () => {
    expect(documentFileLabel("notes.pdf")).toBe("notes.pdf");
  });
});

describe("toStudentVisibleGrade", () => {
  const grade = {
    id: "g1",
    assessmentId: "a1",
    studentId: "s1",
    score: 78,
    classification: "DISTINCTION" as const,
    isPublished: false,
  };

  it("strips score and classification while a result is withheld", () => {
    const visible = toStudentVisibleGrade(grade);
    expect(visible.score).toBeNull();
    expect(visible.classification).toBeNull();
    expect(visible.status).toBe("Withheld");
  });

  it("returns the score and tier once published", () => {
    const visible = toStudentVisibleGrade({ ...grade, isPublished: true });
    expect(visible.score).toBe(78);
    expect(visible.classification).toBe("Distinction");
    expect(visible.status).toBe("Published");
  });
});
