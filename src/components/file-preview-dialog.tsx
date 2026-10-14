"use client";

import { DownloadIcon, FileTextIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { documentFileLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

function fileKind(fileName: string): "pdf" | "docx" | "other" {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  return "other";
}

function DocxView({ href }: { href: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(href);
        if (!response.ok) throw new Error("missing");
        const buffer = await response.arrayBuffer();
        const mammoth = await import("mammoth");
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        const safe = result.value
          .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
          .replace(/\son\w+="[^"]*"/gi, "")
          .trim();
        if (!safe) throw new Error("empty");
        if (!cancelled) setHtml(safe);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [href]);

  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <FileTextIcon className="size-8 text-muted-foreground/70" />
        <p className="max-w-sm text-sm text-muted-foreground">
          This Word file can’t be previewed. Download it to open it.
        </p>
      </div>
    );
  }

  if (!html) {
    return <div className="h-full w-full animate-pulse bg-muted/40" />;
  }

  return (
    <article
      className="docx-preview h-full overflow-y-auto bg-white px-6 py-8 text-[15px] leading-relaxed text-neutral-900 sm:px-10"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function PdfView({ href }: { href: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function load() {
      try {
        const response = await fetch(href);
        if (!response.ok) throw new Error("missing");
        const blob = await response.blob();
        const header = new TextDecoder().decode(await blob.slice(0, 5).arrayBuffer());
        if (!header.startsWith("%PDF")) throw new Error("invalid");
        objectUrl = URL.createObjectURL(
          new Blob([blob], { type: "application/pdf" }),
        );
        if (!cancelled) setSrc(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [href]);

  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <FileTextIcon className="size-8 text-muted-foreground/70" />
        <p className="max-w-sm text-sm text-muted-foreground">
          This PDF can’t be previewed. Download it to open it.
        </p>
      </div>
    );
  }

  if (!src) {
    return <div className="h-full w-full animate-pulse bg-muted/40" />;
  }

  return (
    <iframe
      title="PDF preview"
      src={src}
      className="h-full w-full border-0 bg-white"
    />
  );
}

export function FilePreviewTrigger({
  href,
  fileName,
  className,
  children,
}: {
  href: string;
  fileName: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const kind = fileKind(fileName);
  const label = documentFileLabel(fileName);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={fileName}
        className={cn(
          "max-w-full truncate text-left font-mono text-[length:var(--step-0)] tabular-nums",
          "text-foreground underline decoration-foreground/35 underline-offset-4",
          "hover:decoration-foreground",
          className,
        )}
      >
        {children ?? label}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex flex-col gap-0 overflow-hidden bg-card p-0"
          style={{
            transform: "none",
            translate: "none",
            animation: "none",
            top: "0.75rem",
            left: 0,
            right: 0,
            marginInline: "auto",
            width:
              kind === "pdf"
                ? "min(840px, calc(100vw - 1rem))"
                : "min(680px, calc(100vw - 1rem))",
            maxWidth: "none",
            height: "calc(100dvh - 1.5rem)",
            maxHeight: kind === "pdf" ? "920px" : "780px",
          }}
        >
          <DialogHeader className="border-b border-border/60 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 pr-8">
              <DialogTitle className="min-w-0 flex-1 truncate text-base font-medium">
                {label}
              </DialogTitle>
              <Button size="sm" variant="outline" className="shrink-0 gap-1.5" asChild>
                <a href={href} download={fileName}>
                  <DownloadIcon className="size-3.5" />
                  Download
                </a>
              </Button>
            </div>
          </DialogHeader>
          <div className="min-h-0 flex-1 bg-muted/30">
            {kind === "pdf" ? (
              <PdfView href={href} />
            ) : kind === "docx" ? (
              <DocxView href={href} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <FileTextIcon className="size-8 text-muted-foreground/70" />
                <p className="max-w-sm text-sm text-muted-foreground">
                  Preview isn’t available for this file.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
