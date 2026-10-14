"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createAssessment } from "@/actions/assessments";
import { PendingButton } from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/datetime-picker";
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

export function CreateAssessmentDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: "",
    moduleCode: "",
    deadline: "",
  });

  function submit() {
    startTransition(async () => {
      const result = await createAssessment(form);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setForm({ title: "", moduleCode: "", deadline: "" });
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">Create Assessment</Button>
      </DialogTrigger>
      <DialogContent className="dialog-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Assessment</DialogTitle>
          <DialogDescription>
            Define title, module code, and submission deadline.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="moduleCode">Module code</FieldLabel>
            <Input
              id="moduleCode"
              className="font-mono tabular-nums"
              value={form.moduleCode}
              onChange={(e) =>
                setForm({ ...form, moduleCode: e.target.value })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="deadline">Deadline</FieldLabel>
            <DateTimePicker
              id="deadline"
              value={form.deadline}
              onChange={(deadline) => setForm({ ...form, deadline })}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <PendingButton
            type="button"
            pending={pending}
            idle="Create"
            pendingLabel="Creating"
            onClick={submit}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
