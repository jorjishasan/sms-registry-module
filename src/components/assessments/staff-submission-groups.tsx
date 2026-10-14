"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { ExtendDeadlineDialog } from "@/components/assessments/extend-deadline-dialog";
import { FilePreviewTrigger } from "@/components/file-preview-dialog";
import { StatusBadge } from "@/components/status-badge";
import { documentFileLabel, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type SubmissionRow = {
  id: string;
  fileName: string;
  fileUrl: string;
  isLate: boolean;
  submittedAt: string;
  studentName: string;
  studentCode: string;
};

type AssessmentGroup = {
  id: string;
  title: string;
  moduleCode: string;
  deadlineLabel: string;
  closed: boolean;
  deadlineIso: string;
  submissions: SubmissionRow[];
};

export function StaffSubmissionGroups({
  assessments,
}: {
  assessments: AssessmentGroup[];
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(assessments[0] ? [assessments[0].id] : []),
  );

  function toggle(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {assessments.map((assessment) => {
        const open = openIds.has(assessment.id);
        const count = assessment.submissions.length;
        return (
          <section
            key={assessment.id}
            className="overflow-hidden rounded-xl bg-card ring-1 ring-border/70"
          >
            <div className="flex items-center gap-2 px-2 py-2">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => toggle(assessment.id)}
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-muted/50"
              >
                <ChevronDownIcon
                  className={cn(
                    "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                    open ? "rotate-0" : "-rotate-90",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[length:var(--step-0)] font-medium leading-snug">
                    {assessment.title}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[length:var(--step--1)] text-muted-foreground/70">
                    <span className="font-mono tabular-nums">
                      {assessment.moduleCode}
                    </span>
                    <span aria-hidden className="text-border">
                      ·
                    </span>
                    <span className="tabular-nums">{assessment.deadlineLabel}</span>
                    {assessment.closed ? (
                      <>
                        <span aria-hidden className="text-border">
                          ·
                        </span>
                        <span>Closed</span>
                      </>
                    ) : null}
                    <span aria-hidden className="text-border">
                      ·
                    </span>
                    <span className="font-medium text-foreground/80 tabular-nums">
                      {count}
                    </span>
                  </span>
                </span>
              </button>
              <ExtendDeadlineDialog
                assessmentId={assessment.id}
                title={assessment.title}
                currentDeadline={assessment.deadlineIso}
              />
            </div>
            {open ? (
              assessment.submissions.length === 0 ? (
                <p className="border-t border-border/50 px-4 py-2.5 text-[length:var(--step--1)] text-muted-foreground">
                  No submissions
                </p>
              ) : (
                <ul className="border-t border-border/50">
                  {assessment.submissions.map((submission) => (
                    <li
                      key={submission.id}
                      className="grid grid-cols-1 items-center gap-1 border-b border-border/40 px-4 py-2 last:border-b-0 lg:grid-cols-[minmax(0,1.4fr)_9.5rem_minmax(7rem,1fr)_4.5rem] lg:gap-x-4"
                    >
                      <p className="min-w-0 truncate text-[length:var(--step--1)] leading-tight">
                        <span className="font-medium">{submission.studentName}</span>
                        <span className="ml-2 font-mono tabular-nums text-muted-foreground">
                          {submission.studentCode}
                        </span>
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 lg:contents">
                        <p className="font-mono text-[length:var(--step--1)] tabular-nums text-muted-foreground lg:text-right">
                          {formatDateTime(submission.submittedAt)}
                        </p>
                        <FilePreviewTrigger
                          href={submission.fileUrl}
                          fileName={submission.fileName}
                          className="min-w-0 text-[length:var(--step--1)] lg:justify-self-end"
                        >
                          {documentFileLabel(submission.fileName)}
                        </FilePreviewTrigger>
                        <div className="lg:justify-self-end">
                          <StatusBadge
                            tone={submission.isLate ? "danger" : "success"}
                          >
                            {submission.isLate ? "Late" : "On time"}
                          </StatusBadge>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
