import { StaffMarksheet } from "@/components/marksheet/staff-marksheet";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, gradeTone } from "@/components/status-badge";
import { formatGradeClassification, toStudentVisibleGrade } from "@/lib/grades";
import { prisma } from "@/lib/prisma";
import { getRoleState } from "@/lib/role";
import { getActiveStudentId } from "@/lib/queries";

export default async function MarksheetPage() {
  const { role } = await getRoleState();

  const [assessments, students, grades] = await Promise.all([
    prisma.assessment.findMany({ orderBy: { moduleCode: "asc" } }),
    prisma.student.findMany({ orderBy: { studentId: "asc" } }),
    prisma.grade.findMany(),
  ]);

  if (role === "student") {
    const studentId = await getActiveStudentId();

    const studentGrades = grades
      .filter((grade) => grade.studentId === studentId)
      .map(toStudentVisibleGrade);

    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="My Marksheet" />

        <ul className="overflow-hidden rounded-xl bg-card ring-1 ring-border/70">
          {assessments.map((assessment) => {
            const grade = studentGrades.find(
              (item) => item.assessmentId === assessment.id,
            );
            return (
              <li
                key={assessment.id}
                className="grid items-center gap-2 border-b border-border/50 px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_4rem_8rem_auto] sm:gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{assessment.title}</p>
                  <p className="font-mono text-[length:var(--step--1)] tabular-nums text-muted-foreground">
                    {assessment.moduleCode}
                  </p>
                </div>
                <p className="font-mono text-[length:var(--step-0)] tabular-nums">
                  {grade?.score ?? "—"}
                </p>
                {grade?.classification ? (
                  <StatusBadge tone={gradeTone(grade.classification)}>
                    {grade.classification}
                  </StatusBadge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
                {!grade ? (
                  <StatusBadge tone="neutral">No grade</StatusBadge>
                ) : (
                  <StatusBadge tone={grade.isPublished ? "success" : "warning"}>
                    {grade.isPublished ? "Published" : "Withheld"}
                  </StatusBadge>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
        <PageHeader title="Marksheet & Results" />

      <StaffMarksheet
        assessments={assessments.map((assessment) => ({
          id: assessment.id,
          title: assessment.title,
          moduleCode: assessment.moduleCode,
        }))}
        students={students.map((student) => ({
          id: student.id,
          studentId: student.studentId,
          fullName: student.fullName,
        }))}
        grades={grades.map((grade) => ({
          id: grade.id,
          assessmentId: grade.assessmentId,
          studentId: grade.studentId,
          score: grade.score,
          classification: formatGradeClassification(grade.classification),
          isPublished: grade.isPublished,
        }))}
      />
    </div>
  );
}
