import { Suspense } from "react";
import type { StudentStatus } from "@prisma/client";
import { EnrolStudentDialog } from "@/components/students/enrol-student-dialog";
import { StudentsFilters } from "@/components/students/students-filters";
import { PageHeader } from "@/components/page-header";
import {
  StatusBadge,
  studentStatusTone,
} from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatStatusLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getRoleState } from "@/lib/role";
import { getActiveStudentId } from "@/lib/queries";

type SearchParams = Promise<{
  name?: string;
  id?: string;
  programme?: string;
  status?: string;
}>;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { role } = await getRoleState();
  const params = await searchParams;
  const programmes = await prisma.programme.findMany({
    orderBy: { code: "asc" },
  });

  if (role === "student") {
    const viewingStudentId = await getActiveStudentId();
    const student = viewingStudentId
      ? await prisma.student.findUnique({
          where: { id: viewingStudentId },
          include: { programme: true },
        })
      : null;

    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="My Enrolment"
          description="Your programme registration details."
        />
        {student ? (
          <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="h-12">
                <TableCell className="font-mono tabular-nums">
                  {student.studentId}
                </TableCell>
                <TableCell>{student.fullName}</TableCell>
                <TableCell>
                  {student.programme.name}{" "}
                  <span className="font-mono tabular-nums text-muted-foreground">
                    ({student.programme.code})
                  </span>
                </TableCell>
                <TableCell className="font-mono tabular-nums">
                  {student.academicYear}
                </TableCell>
                <TableCell>
                  <StatusBadge tone={studentStatusTone(student.status)}>
                    {formatStatusLabel(student.status)}
                  </StatusBadge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select a student persona to view enrolment.
          </p>
        )}
      </div>
    );
  }

  const status = params.status as StudentStatus | undefined;

  const students = await prisma.student.findMany({
    where: {
      AND: [
        params.name
          ? { fullName: { contains: params.name, mode: "insensitive" } }
          : {},
        params.id
          ? { studentId: { contains: params.id, mode: "insensitive" } }
          : {},
        params.programme ? { programmeId: params.programme } : {},
        status ? { status } : {},
      ],
    },
    include: { programme: true },
    orderBy: { studentId: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Student Enrolment"
        description="Filter and enrol students without leaving the registry table."
        actions={
          <EnrolStudentDialog
            programmes={programmes.map((p) => ({
              id: p.id,
              code: p.code,
              name: p.name,
            }))}
          />
        }
      />

      <Suspense fallback={null}>
        <StudentsFilters
          programmes={programmes.map((p) => ({
            id: p.id,
            code: p.code,
            name: p.name,
          }))}
        />
      </Suspense>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border/70">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">DoB</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead className="hidden md:table-cell">Year</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id} className="h-12">
                <TableCell className="font-mono tabular-nums">
                  {student.studentId}
                </TableCell>
                <TableCell>{student.fullName}</TableCell>
                <TableCell className="hidden lg:table-cell">{student.email}</TableCell>
                <TableCell className="hidden font-mono tabular-nums lg:table-cell">
                  {formatDate(student.dateOfBirth)}
                </TableCell>
                <TableCell className="font-mono tabular-nums">
                  {student.programme.code}
                </TableCell>
                <TableCell className="hidden font-mono tabular-nums md:table-cell">
                  {student.academicYear}
                </TableCell>
                <TableCell>
                  <StatusBadge tone={studentStatusTone(student.status)}>
                    {formatStatusLabel(student.status)}
                  </StatusBadge>
                </TableCell>
              </TableRow>
            ))}
            {students.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No students match these filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
