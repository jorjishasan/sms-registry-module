"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { setRole, setViewingStudent } from "@/actions/role";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/role";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/students", label: "Enrolment" },
  { href: "/fees", label: "Fees" },
  { href: "/assessments", label: "Assessments" },
  { href: "/marksheet", label: "Marksheet" },
];

type StudentOption = {
  id: string;
  studentId: string;
  fullName: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppNavbar({
  role,
  viewingStudentId,
  students,
}: {
  role: AppRole;
  viewingStudentId: string | null;
  students: StudentOption[];
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const activeStudent =
    students.find((student) => student.id === viewingStudentId) ?? students[0];

  const activeLink =
    links.find((link) =>
      link.href === "/" ? pathname === "/" : pathname.startsWith(link.href),
    ) ?? links[0];

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-[length:var(--step-0)] font-medium text-background lg:hidden",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            )}
          >
            {activeLink.label}
            <ChevronDownIcon className="size-3.5 opacity-80" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {links.map((link) => {
              const active = link.href === activeLink.href;
              return (
                <DropdownMenuItem key={link.href} asChild>
                  <Link
                    href={link.href}
                    className={cn(active && "font-medium")}
                  >
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <nav
          aria-label="Primary"
          className="hidden min-w-0 items-center gap-1 lg:flex"
        >
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onPointerEnter={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const fromRight = event.clientX > rect.left + rect.width / 2;
                  event.currentTarget.dataset.origin = fromRight ? "right" : "left";
                }}
                className={cn(
                  "nav-pill shrink-0 rounded-full px-3.5 py-2 text-[length:var(--step-0)]",
                  active
                    ? "is-active bg-foreground text-background"
                    : "text-muted-foreground",
                )}
              >
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
            {role === "student" ? (
            <div className="relative h-9 w-[168px]">
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={pending}
                    aria-label={
                      activeStudent
                        ? `Viewing as ${activeStudent.fullName}`
                        : "Choose student"
                    }
                    className={cn(
                      "flex h-9 w-full items-center gap-2 rounded-full px-1.5 pr-2.5",
                      "bg-muted/50 ring-1 ring-border/60",
                      "text-left outline-none transition-colors duration-150",
                      "hover:bg-muted hover:ring-border",
                      "focus-visible:ring-2 focus-visible:ring-ring/50",
                      "data-[state=open]:bg-muted data-[state=open]:ring-border",
                    )}
                  >
                    <span
                      aria-hidden
                      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold tracking-wide text-background"
                    >
                      {activeStudent ? initials(activeStudent.fullName) : "—"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[length:var(--step-0)] font-medium">
                      {activeStudent?.fullName.split(" ")[0] ?? "Student"}
                    </span>
                    <ChevronDownIcon
                      className={cn(
                        "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                        pickerOpen && "rotate-180",
                      )}
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  sideOffset={6}
                  className="w-64 overflow-hidden p-1"
                >
                  <ul className="scrollbar-thin max-h-64 overflow-y-auto overflow-x-hidden">
                    {students.map((student) => {
                      const active = student.id === activeStudent?.id;
                      return (
                        <li key={student.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setPickerOpen(false);
                              startTransition(async () => {
                                await setViewingStudent(student.id);
                              });
                            }}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left",
                              "transition-colors duration-150",
                              active ? "bg-muted" : "hover:bg-muted/70",
                            )}
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tracking-wide",
                                active
                                  ? "bg-foreground text-background"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {initials(student.fullName)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[length:var(--step-0)] font-medium">
                                {student.fullName}
                              </span>
                              <span className="block truncate font-mono text-[length:var(--step--1)] tabular-nums text-muted-foreground">
                                {student.studentId}
                              </span>
                            </span>
                            {active ? (
                              <CheckIcon className="size-3.5 shrink-0 text-foreground" />
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </PopoverContent>
              </Popover>
            </div>
            ) : null}

            <div
              role="group"
              aria-label="View mode"
              className="relative grid h-9 w-[168px] grid-cols-2 rounded-full bg-muted/70 p-0.5 ring-1 ring-border/60"
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-card shadow-sm ring-1 ring-border/50",
                  "transition-transform duration-300 ease-spring",
                  role === "student" ? "translate-x-full" : "translate-x-0",
                )}
              />
              <button
                type="button"
                disabled={pending}
                aria-pressed={role === "staff"}
                onClick={() =>
                  startTransition(async () => {
                    await setRole("staff");
                  })
                }
                className={cn(
                  "relative z-10 rounded-full text-[length:var(--step-0)] font-medium",
                  "transition-colors duration-200",
                  role === "staff"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Staff
              </button>
              <button
                type="button"
                disabled={pending}
                aria-pressed={role === "student"}
                onClick={() =>
                  startTransition(async () => {
                    await setRole("student");
                  })
                }
                className={cn(
                  "relative z-10 rounded-full text-[length:var(--step-0)] font-medium",
                  "transition-colors duration-200",
                  role === "student"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Student
              </button>
            </div>
        </div>
      </div>
    </header>
  );
}
