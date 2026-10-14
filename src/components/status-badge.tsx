import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneClasses: Record<Tone, string> = {
  success:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  warning:
    "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  danger:
    "border-red-500/25 bg-red-500/10 text-red-800 dark:text-red-300",
  info: "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  neutral: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "badge-pop rounded-full px-2.5 py-0.5 font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </Badge>
  );
}

export function studentStatusTone(
  status: "ENROLLED" | "DEFERRED" | "WITHDRAWN" | "COMPLETED",
): Tone {
  switch (status) {
    case "ENROLLED":
    case "COMPLETED":
      return "success";
    case "DEFERRED":
      return "warning";
    case "WITHDRAWN":
      return "danger";
  }
}

export function gradeTone(classification: string | null | undefined): Tone {
  if (!classification) return "neutral";
  if (classification === "Fail" || classification === "FAIL") return "danger";
  return "success";
}
