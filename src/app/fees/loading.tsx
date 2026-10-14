"use client";

import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/table-skeleton";
import { useAppRole } from "@/lib/use-app-role";

export default function FeesLoading() {
  const role = useAppRole();

  return (
    <>
      <PageHeader
        title="Fees & Payments"
        description="Balances are computed live from programme fees minus payment sum."
      />
      <TableSkeleton
        columns={
          role === "staff"
            ? [
                "Student ID",
                "Name",
                "Base fee",
                "Total paid",
                "Balance",
                "Status",
                "Action",
              ]
            : [
                "Student ID",
                "Name",
                "Base fee",
                "Total paid",
                "Balance",
                "Status",
              ]
        }
        rows={role === "student" ? 1 : 6}
      />
      {role === "student" ? (
        <TableSkeleton rows={3} columns={["Reference", "Amount", "Date"]} />
      ) : null}
    </>
  );
}
