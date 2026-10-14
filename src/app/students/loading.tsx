"use client";

import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppRole } from "@/lib/use-app-role";

export default function StudentsLoading() {
  const role = useAppRole();

  if (role === "student") {
    return (
      <>
        <PageHeader
          title="My Enrolment"
          description="Your programme registration details."
        />
        <TableSkeleton
          rows={1}
          columns={["Student ID", "Name", "Programme", "Year", "Status"]}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Student Enrolment"
        description="Filter and enrol students without leaving the registry table."
        actions={<Skeleton className="h-9 w-32 rounded-lg" />}
      />
      <div className="grid gap-3 rounded-xl bg-card/60 p-4 ring-1 ring-border/70 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
      <TableSkeleton
        columns={[
          "Student ID",
          "Name",
          "Email",
          "DoB",
          "Programme",
          "Year",
          "Status",
        ]}
      />
    </>
  );
}
