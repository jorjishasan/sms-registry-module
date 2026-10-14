import { CreateAssessmentDialog } from "@/components/assessments/create-assessment-dialog";
import { StaffSubmissionGroups } from "@/components/assessments/staff-submission-groups";
import { SubmissionUpload } from "@/components/assessments/submission-upload";
import { FilePreviewTrigger } from "@/components/file-preview-dialog";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { isPastDeadline } from "@/lib/calculations";
import { documentFileLabel, formatDate, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getRoleState } from "@/lib/role";
import { getActiveStudentId } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AssessmentsPage() {
  const { role } = await getRoleState();
  const now = new Date();

  if (role === "student") {
    const studentId = await getActiveStudentId();

    if (!studentId) {
      return (
        <p className="text-sm text-muted-foreground">
          No student persona available.
        </p>
      );
    }

    const assessments = await prisma.assessment.findMany({
      orderBy: { deadline: "asc" },
      include: {
        submissions: {
          where: { studentId },
          select: {
            fileName: true,
            fileUrl: true,
            isLate: true,
          },
        },
      },
    });

    const open = assessments.filter(
      (assessment) => !isPastDeadline(now, assessment.deadline),
    );
    const closed = assessments.filter((assessment) =>
      isPastDeadline(now, assessment.deadline),
    );

    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Assessments" />

        <section className="flex flex-col gap-3">
          {open.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing due.</p>
          ) : (
            open.map((assessment) => {
              const submission = assessment.submissions[0] ?? null;
              return (
                <article
                  key={assessment.id}
                  className="rounded-xl bg-card px-4 py-4 ring-1 ring-border/70"
                >
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-medium">{assessment.title}</h2>
                      <p className="font-mono text-[length:var(--step--1)] tabular-nums text-muted-foreground">
                        {assessment.moduleCode}
                        <span className="mx-1.5 text-border">·</span>
                        {formatDateTime(assessment.deadline)}
                      </p>
                    </div>
                    {!submission ? (
                      <StatusBadge tone="info">Open</StatusBadge>
                    ) : null}
                  </div>
                  <SubmissionUpload
                    assessmentId={assessment.id}
                    studentId={studentId}
                    existing={
                      submission
                        ? {
                            fileName: submission.fileName,
                            fileUrl: submission.fileUrl,
                            isLate: submission.isLate,
                          }
                        : null
                    }
                  />
                </article>
              );
            })
          )}
        </section>

        {closed.length > 0 ? (
          <section className="flex flex-col gap-3">
            <p className="text-[length:var(--step--1)] font-medium tracking-wide text-muted-foreground uppercase">
              Closed
            </p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {closed.map((assessment) => {
                const submission = assessment.submissions[0] ?? null;
                return (
                  <li
                    key={assessment.id}
                    className="flex flex-col gap-2 rounded-lg bg-muted/40 px-3 py-3 ring-1 ring-border/50"
                  >
                    <div className="min-w-0 opacity-80">
                      <p className="line-clamp-2 text-[length:var(--step-0)] leading-snug">
                        {assessment.title}
                      </p>
                      <p className="mt-0.5 font-mono text-[length:var(--step--1)] tabular-nums text-muted-foreground">
                        {assessment.moduleCode}
                        <span className="mx-1 text-border">·</span>
                        {formatDate(assessment.deadline)}
                      </p>
                    </div>
                    {submission ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {submission.isLate ? (
                          <StatusBadge tone="danger">Late</StatusBadge>
                        ) : null}
                        <FilePreviewTrigger
                          href={submission.fileUrl}
                          fileName={submission.fileName}
                          className="text-[length:var(--step--1)] opacity-90"
                        >
                          {documentFileLabel(submission.fileName)}
                        </FilePreviewTrigger>
                      </div>
                    ) : (
                      <SubmissionUpload
                        assessmentId={assessment.id}
                        studentId={studentId}
                        existing={null}
                        late
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    );
  }

  const assessments = await prisma.assessment.findMany({
    include: {
      submissions: {
        include: { student: true },
        orderBy: { submittedAt: "desc" },
      },
    },
    orderBy: { deadline: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assessment Submissions"
        description="Review uploads with on-time and late flags."
        actions={<CreateAssessmentDialog />}
      />

      <StaffSubmissionGroups
        assessments={assessments.map((assessment) => ({
          id: assessment.id,
          title: assessment.title,
          moduleCode: assessment.moduleCode,
          deadlineLabel: formatDateTime(assessment.deadline),
          closed: isPastDeadline(now, assessment.deadline),
          deadlineIso: assessment.deadline.toISOString(),
          submissions: assessment.submissions.map((submission) => ({
            id: submission.id,
            fileName: submission.fileName,
            fileUrl: submission.fileUrl,
            isLate: submission.isLate,
            submittedAt: submission.submittedAt.toISOString(),
            studentName: submission.student.fullName,
            studentCode: submission.student.studentId,
          })),
        }))}
      />
    </div>
  );
}
