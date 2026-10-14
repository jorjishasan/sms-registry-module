"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function PendingButton({
  pending,
  idle,
  pendingLabel,
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof Button> & {
  pending: boolean;
  idle: string;
  pendingLabel: string;
}) {
  return (
    <Button
      aria-busy={pending || undefined}
      disabled={disabled || pending}
      className={cn("cursor-pointer", className)}
      {...props}
    >
      <span className="inline-grid place-items-center">
        <span
          className={cn(
            "col-start-1 row-start-1 inline-flex items-center gap-1.5",
            pending && "invisible",
          )}
        >
          {idle}
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1 inline-flex items-center gap-1.5",
            !pending && "invisible",
          )}
        >
          <Spinner className="size-3.5" />
          {pendingLabel}
        </span>
      </span>
    </Button>
  );
}
