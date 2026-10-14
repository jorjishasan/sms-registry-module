"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveGrade, togglePublishGrade } from "@/actions/grades";
import { PendingButton } from "@/components/pending-button";
import { StatusBadge, gradeTone } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getGradeClassification } from "@/lib/calculations";

export function GradeCell({
  assessmentId,
  studentId,
  grade,
}: {
  assessmentId: string;
  studentId: string;
  grade: {
    id: string;
    score: number;
    classification: string;
    isPublished: boolean;
  } | null;
}) {
  const [score, setScore] = useState(grade?.score?.toString() ?? "");
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"save" | "publish" | null>(null);

  const preview = useMemo(() => {
    if (score.trim() === "") return null;
    const numeric = Number(score);
    if (!Number.isInteger(numeric) || numeric < 0 || numeric > 100) {
      return null;
    }
    try {
      return getGradeClassification(numeric);
    } catch {
      return null;
    }
  }, [score]);

  function onSave() {
    setAction("save");
    startTransition(async () => {
      const result = await saveGrade({ assessmentId, studentId, score });
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
      setAction(null);
    });
  }

  function onToggle(next: boolean) {
    if (!grade) return;
    setAction("publish");
    startTransition(async () => {
      const result = await togglePublishGrade({
        gradeId: grade.id,
        isPublished: next,
      });
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
      setAction(null);
    });
  }

  const saving = pending && action === "save";

  return (
    <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 lg:grid lg:grid-cols-[4.25rem_7.25rem_4.75rem_minmax(6.5rem,auto)] lg:gap-y-0">
      <Input
        type="number"
        min={0}
        max={100}
        aria-label="Score"
        className="h-8 w-16 font-mono tabular-nums lg:w-full"
        value={score}
        disabled={pending}
        onChange={(event) => setScore(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSave();
        }}
      />
      <div className="min-w-0">
        {preview ? (
          <StatusBadge tone={gradeTone(preview)}>{preview}</StatusBadge>
        ) : (
          <span className="text-[length:var(--step--1)] text-muted-foreground">
            —
          </span>
        )}
      </div>
      <PendingButton
        size="sm"
        pending={saving}
        disabled={pending && !saving}
        idle="Save"
        pendingLabel="Saving"
        onClick={onSave}
      />
      <div className="flex items-center justify-end gap-2">
        {grade ? (
          <>
            <span className="text-[length:var(--step--1)] text-muted-foreground">
              {grade.isPublished ? "Published" : "Withheld"}
            </span>
            <Switch
              checked={grade.isPublished}
              disabled={pending}
              onCheckedChange={onToggle}
              aria-label={
                grade.isPublished ? "Withhold grade" : "Publish grade"
              }
            />
          </>
        ) : (
          <span className="text-[length:var(--step--1)] text-muted-foreground">
            Not saved
          </span>
        )}
      </div>
    </div>
  );
}
