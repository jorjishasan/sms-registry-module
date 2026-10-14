"use client";

import { useState, useTransition } from "react";
import { CalendarClockIcon } from "lucide-react";
import { toast } from "sonner";
import { extendAssessmentDeadline } from "@/actions/assessments";
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
import { toLocalDateTimeValue } from "@/lib/deadline-input";

export function ExtendDeadlineDialog({
  assessmentId,
  title,
  currentDeadline,
}: {
  assessmentId: string;
  title: string;
  currentDeadline: Date | string;
}) {
  const pickerValue = toLocalDateTimeValue(currentDeadline);
  const [open, setOpen] = useState(false);
  const [deadline, setDeadline] = useState(pickerValue);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await extendAssessmentDeadline({
        assessmentId,
        deadline,
      });
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDeadline(pickerValue);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <CalendarClockIcon />
          Extend
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Extend deadline</DialogTitle>
          <DialogDescription className="line-clamp-2">{title}</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="extend-deadline">New deadline</FieldLabel>
            <DateTimePicker
              id="extend-deadline"
              value={deadline}
              onChange={setDeadline}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <PendingButton
            type="button"
            pending={pending}
            idle="Save"
            pendingLabel="Saving"
            onClick={submit}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
