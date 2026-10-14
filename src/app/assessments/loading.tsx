"use client";

import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppRole } from "@/lib/use-app-role";

export default function AssessmentsLoading() {
  const role = useAppRole();

  if (role === "student") {
    return (
      <>
        <PageHeader title="Assessments" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl bg-card px-4 py-4 ring-1 ring-border/70"
            >
              <Skeleton className="mb-2 h-4 w-48" />
              <Skeleton className="mb-4 h-3 w-36" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-14" />
          <div className="rounded-lg bg-muted/40 px-3 py-2 ring-1 ring-border/50">
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Assessment Submissions"
        description="Review uploads with on-time and late flags."
        actions={<Skeleton className="h-9 w-40 rounded-lg" />}
      />
      <TableSkeleton
        columns={[
          "Assessment",
          "Module",
          "Student",
          "Submitted",
          "File",
          "Flag",
        ]}
      />
    </>
  );
}
