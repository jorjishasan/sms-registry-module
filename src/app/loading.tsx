"use client";

import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/table-skeleton";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppRole } from "@/lib/use-app-role";

export default function DashboardLoading() {
  const role = useAppRole();

  if (role === "student") {
    return (
      <>
        <PageHeader
          title="Student Portal"
          description="Your programme, fees, and released results."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-7 w-28" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <TableSkeleton
          columns={["Assessment", "Score", "Classification", "Status"]}
          rows={3}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Registry Dashboard"
        description="Operational overview of enrolment, fees, and grade releases."
      />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="gap-3">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-9 w-20" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="font-heading text-base font-medium">
            Attention Required: Overdue Fees
          </div>
          <p className="text-sm text-muted-foreground">
            Students with outstandingBalance &gt; 0
          </p>
        </CardHeader>
        <div className="px-4 pb-4">
          <TableSkeleton
            className="rounded-lg"
            columns={["Student ID", "Name", "Programme", "Balance", "Flag"]}
            rows={3}
          />
        </div>
      </Card>
    </>
  );
}
