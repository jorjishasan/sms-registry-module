"use client";

import { useState, useTransition } from "react";
import { SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { recordPayment, suggestPaymentReference } from "@/actions/fees";
import { PendingButton } from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { Spinner } from "@/components/ui/spinner";

export function RecordPaymentDialog({
  studentId,
  studentLabel,
}: {
  studentId: string;
  studentLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [generatingRef, setGeneratingRef] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    referenceNumber: "",
  });

  async function generateReference() {
    setGeneratingRef(true);
    const result = await suggestPaymentReference(form.paymentDate);
    setGeneratingRef(false);
    if (result.success) {
      setForm((prev) => ({ ...prev, referenceNumber: result.reference }));
    } else {
      toast.error(result.message);
    }
  }

  function submit() {
    startTransition(async () => {
      const result = await recordPayment({
        studentId,
        amount: form.amount,
        paymentDate: form.paymentDate,
        referenceNumber: form.referenceNumber,
      });
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setForm({
          amount: "",
          paymentDate: new Date().toISOString().slice(0, 10),
          referenceNumber: "",
        });
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="cursor-pointer">
          Record payment
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Ledger entry for{" "}
            <span className="font-mono tabular-nums">{studentLabel}</span>
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="amount">Amount (£)</FieldLabel>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              className="font-mono tabular-nums"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="paymentDate">Payment date</FieldLabel>
            <DatePicker
              id="paymentDate"
              value={form.paymentDate}
              onChange={(paymentDate) => setForm({ ...form, paymentDate })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="reference">Reference number</FieldLabel>
            <div className="flex gap-1.5">
              <Input
                id="reference"
                className="font-mono tabular-nums"
                value={form.referenceNumber}
                onChange={(e) =>
                  setForm({ ...form, referenceNumber: e.target.value })
                }
                placeholder="PAY-2026-0004"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label="Generate reference"
                disabled={generatingRef}
                onClick={() => void generateReference()}
              >
                {generatingRef ? (
                  <Spinner className="size-4" />
                ) : (
                  <SparklesIcon className="size-4" />
                )}
              </Button>
            </div>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <PendingButton
            type="button"
            pending={pending}
            idle="Save payment"
            pendingLabel="Saving"
            onClick={submit}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
