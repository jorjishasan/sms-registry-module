import { RecordPaymentDialog } from "@/components/fees/record-payment-dialog";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateFeeSummary } from "@/lib/calculations";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getRoleState } from "@/lib/role";
import { getActiveStudentId } from "@/lib/queries";

export default async function FeesPage() {
  const { role } = await getRoleState();
  const viewingStudentId =
    role === "student" ? await getActiveStudentId() : null;

  const students = await prisma.student.findMany({
    where: role === "student" && viewingStudentId ? { id: viewingStudentId } : undefined,
    include: {
      programme: true,
      payments: { orderBy: { paymentDate: "desc" } },
    },
    orderBy: { studentId: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fees & Payments"
        description="Balances are computed live from programme fees minus payment sum."
      />

      <ul className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-xl bg-card ring-1 ring-border/70 md:hidden">
        {students.map((student) => {
          const summary = calculateFeeSummary(
            student.programme.baseFee,
            student.payments,
          );
          return (
            <li key={student.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{student.fullName}</p>
                  <p className="font-mono text-[length:var(--step--1)] tabular-nums text-muted-foreground">
                    {student.studentId}
                  </p>
                </div>
                <StatusBadge
                  tone={
                    summary.isOverdue
                      ? summary.totalPaid > 0
                        ? "warning"
                        : "danger"
                      : "success"
                  }
                >
                  {summary.isOverdue
                    ? summary.totalPaid > 0
                      ? "Partial"
                      : "Overdue"
                    : "Paid"}
                </StatusBadge>
              </div>
              <p className="font-mono text-[length:var(--step-0)] tabular-nums">
                {formatCurrency(summary.outstandingBalance)}
                <span className="ml-1.5 text-[length:var(--step--1)] text-muted-foreground">
                  due
                </span>
              </p>
              {role === "staff" ? (
                <RecordPaymentDialog
                  studentId={student.id}
                  studentLabel={student.studentId}
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-hidden rounded-xl bg-card ring-1 ring-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Base fee</TableHead>
              <TableHead>Total paid</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              {role === "staff" ? <TableHead>Action</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => {
              const summary = calculateFeeSummary(
                student.programme.baseFee,
                student.payments,
              );
              return (
                <TableRow key={student.id} className="h-12">
                  <TableCell className="font-mono tabular-nums">
                    {student.studentId}
                  </TableCell>
                  <TableCell>{student.fullName}</TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {formatCurrency(student.programme.baseFee)}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {formatCurrency(summary.totalPaid)}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {formatCurrency(summary.outstandingBalance)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      tone={
                        summary.isOverdue
                          ? summary.totalPaid > 0
                            ? "warning"
                            : "danger"
                          : "success"
                      }
                    >
                      {summary.isOverdue
                        ? summary.totalPaid > 0
                          ? "Partial"
                          : "Overdue"
                        : "Paid"}
                    </StatusBadge>
                  </TableCell>
                  {role === "staff" ? (
                    <TableCell>
                      <RecordPaymentDialog
                        studentId={student.id}
                        studentLabel={student.studentId}
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {role === "student" && students[0] ? (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students[0].payments.map((payment) => (
                <TableRow key={payment.id} className="h-12">
                  <TableCell className="font-mono tabular-nums">
                    {payment.referenceNumber}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {formatDate(payment.paymentDate)}
                  </TableCell>
                </TableRow>
              ))}
              {students[0].payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No payments recorded.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
