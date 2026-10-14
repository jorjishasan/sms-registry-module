import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateFeeSummary } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getRoleState } from "@/lib/role";
import { getActiveStudentId } from "@/lib/queries";
import { toStudentVisibleGrade } from "@/lib/grades";

export default async function DashboardPage() {
  const { role } = await getRoleState();

  if (role === "student") {
    const viewingStudentId = await getActiveStudentId();
    if (!viewingStudentId) {
      return (
        <p className="text-sm text-muted-foreground">
          No seeded students available for Student View.
        </p>
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: viewingStudentId },
      include: {
        programme: true,
        payments: true,
        grades: { include: { assessment: true } },
        submissions: { include: { assessment: true } },
      },
    });

    if (!student) {
      return <p className="text-sm text-muted-foreground">Student not found.</p>;
    }

    const fee = calculateFeeSummary(
      student.programme.baseFee,
      student.payments,
    );
    const visibleGrades = student.grades.map(toStudentVisibleGrade);

    return (
      <>
        <PageHeader
          title="Student Portal"
          description={`Viewing as ${student.studentId} — ${student.fullName}`}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Programme</CardTitle>
              <CardDescription>{student.programme.name}</CardDescription>
            </CardHeader>
            <CardContent className="font-mono tabular-nums text-sm">
              {student.programme.code}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Fee balance</CardTitle>
              <CardDescription>Computed from programme fee</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <span className="font-mono text-[length:var(--step-3)] font-semibold tabular-nums">
                {formatCurrency(fee.outstandingBalance)}
              </span>
              <StatusBadge tone={fee.isOverdue ? "danger" : "success"}>
                {fee.isOverdue ? "Overdue" : "Paid"}
              </StatusBadge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              {[
                { href: "/assessments", label: "Upload assessments" },
                { href: "/marksheet", label: "View marksheet" },
                { href: "/fees", label: "Fee ledger" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-2 py-1.5 text-foreground/85 underline decoration-foreground/80 underline-offset-4 transition-colors duration-150 hover:text-foreground hover:decoration-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent results</CardTitle>
            <CardDescription>
              Unpublished grades are withheld at query time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleGrades.map((grade) => {
                  const assessment = student.grades.find(
                    (item) => item.id === grade.id,
                  )?.assessment;
                  return (
                    <TableRow key={grade.id}>
                      <TableCell>{assessment?.title}</TableCell>
                      <TableCell className="font-mono tabular-nums">
                        {grade.score ?? "—"}
                      </TableCell>
                      <TableCell>{grade.classification ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge
                          tone={grade.isPublished ? "success" : "warning"}
                        >
                          {grade.isPublished
                            ? "Published"
                            : "Withheld / Pending Release"}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </>
    );
  }

  const [students, grades] = await Promise.all([
    prisma.student.findMany({
      include: { programme: true, payments: true },
      orderBy: { studentId: "asc" },
    }),
    prisma.grade.findMany(),
  ]);

  const feeRows = students.map((student) => {
    const summary = calculateFeeSummary(
      student.programme.baseFee,
      student.payments,
    );
    return { student, summary };
  });

  const overdue = feeRows.filter((row) => row.summary.isOverdue);
  const outstandingTotal = feeRows.reduce(
    (sum, row) => sum + row.summary.outstandingBalance,
    0,
  );
  const pendingReleases = grades.filter((grade) => !grade.isPublished).length;

  const stats = [
    { label: "Total Students", value: String(students.length) },
    { label: "Outstanding Fees", value: formatCurrency(outstandingTotal) },
    { label: "Overdue Accounts", value: String(overdue.length) },
    { label: "Pending Grade Releases", value: String(pendingReleases) },
  ];

  return (
    <>
      <PageHeader
        title="Registry Dashboard"
        description="Operational overview of enrolment, fees, and grade releases."
      />

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="font-mono text-[length:var(--step-4)] tabular-nums">
                {stat.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attention Required: Overdue Fees</CardTitle>
          <CardDescription>
            Students with outstandingBalance &gt; 0
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Programme</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Flag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdue.map(({ student, summary }) => (
                <TableRow key={student.id} className="h-12">
                  <TableCell className="font-mono tabular-nums">
                    {student.studentId}
                  </TableCell>
                  <TableCell>{student.fullName}</TableCell>
                  <TableCell className="hidden font-mono tabular-nums md:table-cell">
                    {student.programme.code}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {formatCurrency(summary.outstandingBalance)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone="danger">Overdue</StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
              {overdue.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No overdue fee accounts.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
