"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createStudent } from "@/actions/students";
import { PendingButton } from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProgrammeOption = { id: string; code: string; name: string };

export function EnrolStudentDialog({
  programmes,
}: {
  programmes: ProgrammeOption[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    dateOfBirth: "",
    programmeId: programmes[0]?.id ?? "",
    academicYear: "2025/26",
    status: "ENROLLED",
  });

  function submit() {
    startTransition(async () => {
      const result = await createStudent(form);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setForm({
          fullName: "",
          email: "",
          dateOfBirth: "",
          programmeId: programmes[0]?.id ?? "",
          academicYear: "2025/26",
          status: "ENROLLED",
        });
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">Enrol Student</Button>
      </DialogTrigger>
      <DialogContent className="dialog-surface sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enrol Student</DialogTitle>
          <DialogDescription>
            Auto-generates the next SMS-YYYY-XXXX identifier atomically.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="fullName">Full name</FieldLabel>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="dob">Date of birth</FieldLabel>
            <DatePicker
              id="dob"
              value={form.dateOfBirth}
              onChange={(dateOfBirth) => setForm({ ...form, dateOfBirth })}
            />
          </Field>
          <Field>
            <FieldLabel>Programme</FieldLabel>
            <Select
              value={form.programmeId}
              onValueChange={(value) =>
                value && setForm({ ...form, programmeId: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select programme" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {programmes.map((programme) => (
                    <SelectItem key={programme.id} value={programme.id}>
                      {programme.code} — {programme.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="year">Academic year</FieldLabel>
            <Input
              id="year"
              value={form.academicYear}
              onChange={(e) =>
                setForm({ ...form, academicYear: e.target.value })
              }
            />
          </Field>
          <Field>
            <FieldLabel>Status</FieldLabel>
            <Select
              value={form.status}
              onValueChange={(value) =>
                value && setForm({ ...form, status: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ENROLLED">Enrolled</SelectItem>
                  <SelectItem value="DEFERRED">Deferred</SelectItem>
                  <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <PendingButton
            type="button"
            pending={pending}
            idle="Enrol"
            pendingLabel="Saving"
            onClick={submit}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
