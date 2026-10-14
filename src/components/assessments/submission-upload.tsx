"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { FilePreviewTrigger } from "@/components/file-preview-dialog";
import { PendingButton } from "@/components/pending-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { documentFileLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SubmissionUpload({
  assessmentId,
  studentId,
  existing,
}: {
  assessmentId: string;
  studentId: string;
  existing: { fileName: string; fileUrl: string; isLate: boolean } | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"upload" | "remove" | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  function upload(file: File) {
    setAction("upload");
    startTransition(async () => {
      const body = new FormData();
      body.set("file", file);
      body.set("assessmentId", assessmentId);
      body.set("studentId", studentId);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body,
        });
        const result = (await response.json()) as {
          success: boolean;
          message: string;
        };
        if (result.success) {
          toast.success(result.message);
          setConfirmRemove(false);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Upload failed. Try again.");
      } finally {
        setAction(null);
      }
    });
  }

  function remove() {
    setAction("remove");
    startTransition(async () => {
      try {
        const response = await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assessmentId, studentId }),
        });
        const result = (await response.json()) as {
          success: boolean;
          message: string;
        };
        if (result.success) {
          toast.success(result.message);
          setConfirmRemove(false);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Could not remove file.");
      } finally {
        setAction(null);
      }
    });
  }

  const uploading = pending && action === "upload";
  const removing = pending && action === "remove";

  return (
    <div className="flex flex-col gap-2.5">
      {existing ? (
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={existing.isLate ? "danger" : "success"}>
            {existing.isLate ? "Late" : "Submitted"}
          </StatusBadge>
          <div className="inline-flex min-w-0 items-center gap-1.5">
            <FilePreviewTrigger
              href={existing.fileUrl}
              fileName={existing.fileName}
              className="min-w-0 truncate"
            >
              {documentFileLabel(existing.fileName)}
            </FilePreviewTrigger>
            {confirmRemove ? (
              <div className="ml-1.5 flex items-center gap-1">
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => setConfirmRemove(false)}
                >
                  Keep
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="destructive"
                  disabled={pending}
                  className="gap-1"
                  onClick={remove}
                >
                  {removing ? <Spinner className="size-3" /> : null}
                  Remove
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={pending}
                aria-label="Remove submission"
                className={cn(
                  "bg-muted/80 text-muted-foreground",
                  "transition-[color,background-color,transform] duration-200 ease-out",
                  "hover:bg-destructive/10 hover:text-destructive",
                  "active:scale-[0.96]",
                )}
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      ) : null}

      <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2.5",
            "transition-colors duration-150",
            dragOver ? "border-foreground/40 bg-muted/60" : "border-border",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const file = event.dataTransfer.files?.[0];
            if (file) upload(file);
          }}
        >
          <p className="text-[length:var(--step--1)] text-muted-foreground">
            {existing ? "Replace with PDF or DOCX" : "PDF or DOCX"}
          </p>
          <PendingButton
            type="button"
            variant="default"
            size="sm"
            pending={uploading}
            idle={existing ? "Replace" : "Choose file"}
            pendingLabel="Uploading"
            onClick={() => inputRef.current?.click()}
          />
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
              event.target.value = "";
            }}
        />
      </div>
    </div>
  );
}
