"use client";

import { useSyncExternalStore } from "react";
import type { AppRole } from "@/lib/role";

function subscribe() {
  return () => {};
}

function getSnapshot(): AppRole {
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    if (part.startsWith("sms_role=")) {
      return part.slice("sms_role=".length) === "student" ? "student" : "staff";
    }
  }
  return "staff";
}

function getServerSnapshot(): AppRole {
  return "staff";
}

/** Reads the role cookie during render so route fallbacks paint immediately. */
export function useAppRole(): AppRole {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
