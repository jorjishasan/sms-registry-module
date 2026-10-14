"use client";

import { useMemo, useState } from "react";
import { format, parseISO, isValid, setHours, setMinutes } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Value is local `yyyy-MM-dd'T'HH:mm` for Server Action compatibility. */
export function DateTimePicker({
  id,
  value,
  onChange,
  placeholder = "Pick deadline",
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    if (!value) return undefined;
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  const timeValue = selected ? format(selected, "HH:mm") : "17:00";

  function commit(date: Date, time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    const next = setMinutes(
      setHours(date, Number.isFinite(hours) ? hours : 17),
      Number.isFinite(minutes) ? minutes : 0,
    );
    onChange(format(next, "yyyy-MM-dd'T'HH:mm"));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-haspopup="dialog"
          className={cn(
            "h-9 w-full justify-start font-normal tabular-nums",
            !selected && "text-muted-foreground",
          )}
        >
          <CalendarIcon data-icon="inline-start" />
          {selected
            ? format(selected, "dd MMM yyyy · HH:mm")
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          captionLayout="dropdown"
          onSelect={(date) => {
            if (!date) return;
            commit(date, timeValue);
          }}
        />
        <div className="border-t p-3">
          <Field>
            <FieldLabel htmlFor={`${id ?? "deadline"}-time`}>Time</FieldLabel>
            <Input
              id={`${id ?? "deadline"}-time`}
              type="time"
              className="h-9 font-mono tabular-nums"
              value={timeValue}
              onChange={(event) => {
                const base = selected ?? new Date();
                commit(base, event.target.value);
              }}
            />
          </Field>
        </div>
      </PopoverContent>
    </Popover>
  );
}
