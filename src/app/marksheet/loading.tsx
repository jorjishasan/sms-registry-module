"use client";

import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppRole } from "@/lib/use-app-role";

export default function MarksheetLoading() {
  const role = useAppRole();

  if (role === "student") {
    return (
      <>
        <PageHeader
          title="My Marksheet"
          description="Withheld results never expose score or classification to the client."
        />
        <TableSkeleton
          columns={[
            "Assessment",
            "Module",
            "Score",
            "Classification",
            "Release",
          ]}
          rows={3}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Marksheet & Results"
        description="Score one module at a time, then publish or withhold."
      />
      <div className="flex gap-1 overflow-hidden">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
      <TableSkeleton columns={["Student", "Grade"]} rows={5} />
    </>
  );
}
