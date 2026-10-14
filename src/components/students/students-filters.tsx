"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

type ProgrammeOption = { id: string; code: string; name: string };

export function StudentsFilters({
  programmes,
}: {
  programmes: ProgrammeOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [name, setName] = useState(searchParams.get("name") ?? "");
  const [id, setId] = useState(searchParams.get("id") ?? "");
  const [programme, setProgramme] = useState(
    searchParams.get("programme") ?? "all",
  );
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (name.trim()) params.set("name", name.trim());
      if (id.trim()) params.set("id", id.trim());
      if (programme !== "all") params.set("programme", programme);
      if (status !== "all") params.set("status", status);
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname);
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [name, id, programme, status, pathname, router, startTransition]);

  return (
    <FieldGroup className="grid gap-3 rounded-xl bg-card/60 p-4 ring-1 ring-border/70 transition-shadow duration-200 hover:shadow-sm md:grid-cols-4">
      <Field>
        <FieldLabel htmlFor="filter-name">Name</FieldLabel>
        <Input
          id="filter-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Search name"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="filter-id">Student ID</FieldLabel>
        <Input
          id="filter-id"
          className="font-mono tabular-nums"
          value={id}
          onChange={(event) => setId(event.target.value)}
          placeholder="SMS-2026-0001"
        />
      </Field>
      <Field>
        <FieldLabel>Programme</FieldLabel>
        <Select value={programme} onValueChange={(value) => value && setProgramme(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All programmes" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All programmes</SelectItem>
              {programmes.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.code}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Status</FieldLabel>
        <Select value={status} onValueChange={(value) => value && setStatus(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ENROLLED">Enrolled</SelectItem>
              <SelectItem value="DEFERRED">Deferred</SelectItem>
              <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  );
}
