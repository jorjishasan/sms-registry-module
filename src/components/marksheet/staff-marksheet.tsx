"use client";

import { useMemo, useState } from "react";
import { GradeCell } from "@/components/marksheet/grade-cell";
import { cn } from "@/lib/utils";

type AssessmentOption = {
  id: string;
  title: string;
  moduleCode: string;
};

type StudentOption = {
  id: string;
  studentId: string;
  fullName: string;
};

type GradeOption = {
  id: string;
  assessmentId: string;
  studentId: string;
  score: number;
  classification: string;
  isPublished: boolean;
};

export function StaffMarksheet({
  assessments,
  students,
  grades,
}: {
  assessments: AssessmentOption[];
  students: StudentOption[];
  grades: GradeOption[];
}) {
  const [activeId, setActiveId] = useState(assessments[0]?.id ?? "");

  const gradesByAssessment = useMemo(() => {
    const map = new Map<string, Map<string, GradeOption>>();
    for (const grade of grades) {
      let byStudent = map.get(grade.assessmentId);
      if (!byStudent) {
        byStudent = new Map();
        map.set(grade.assessmentId, byStudent);
      }
      byStudent.set(grade.studentId, grade);
    }
    return map;
  }, [grades]);

  const active =
    assessments.find((item) => item.id === activeId) ?? assessments[0];

  if (!active) {
    return (
      <p className="text-sm text-muted-foreground">
        Create an assessment to start grading.
      </p>
    );
  }

  const gradeByStudent = gradesByAssessment.get(active.id);

  const rowGrid =
    "grid items-center gap-x-4 gap-y-3 px-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,auto)]";

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label="Modules"
        className="flex gap-1.5 overflow-x-auto"
      >
        {assessments.map((assessment) => {
          const selected = assessment.id === active.id;
          return (
            <button
              key={assessment.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveId(assessment.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5",
                "transition-colors duration-150",
                selected
                  ? "bg-foreground text-background"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="font-mono text-[length:var(--step-0)] tabular-nums">
                {assessment.moduleCode}
              </span>
              <span
                className={cn(
                  "max-w-44 truncate text-[length:var(--step--1)]",
                  selected ? "text-background/80" : "opacity-80",
                )}
              >
                {assessment.title}
              </span>
            </button>
          );
        })}
      </div>

    <section className="overflow-hidden rounded-xl bg-card ring-1 ring-border/70">
      <div
        className={cn(
          rowGrid,
          "hidden border-b border-border/50 py-2 text-[length:var(--step--1)] text-muted-foreground lg:grid",
        )}
      >
        <span>Student</span>
        <div className="grid grid-cols-[4.25rem_7.25rem_4.75rem_minmax(6.5rem,auto)] gap-x-3">
          <span>Score</span>
          <span>Result</span>
          <span />
          <span className="text-right">Release</span>
        </div>
      </div>

      {students.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted-foreground">
          No enrolled students to grade.
        </p>
      ) : (
        <ul>
          {students.map((student) => {
            const grade = gradeByStudent?.get(student.id) ?? null;
            return (
              <li
                key={student.id}
                className={cn(
                  rowGrid,
                  "gap-y-2 border-b border-border/50 py-3 last:border-b-0",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium leading-tight">
                    {student.fullName}
                  </p>
                  <p className="mt-0.5 font-mono text-[length:var(--step--1)] tabular-nums text-muted-foreground">
                    {student.studentId}
                  </p>
                </div>
                <GradeCell
                  assessmentId={active.id}
                  studentId={student.id}
                  grade={
                    grade
                      ? {
                          id: grade.id,
                          score: grade.score,
                          classification: grade.classification,
                          isPublished: grade.isPublished,
                        }
                      : null
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
    </div>
  );
}
