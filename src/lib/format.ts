export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Generated uploads are `sms-YYYY-seq-document.ext`. Show the document. */
export function documentFileLabel(fileName: string): string {
  const label = fileName.replace(/^sms-\d{4}-\d+-/i, "");
  return label || fileName;
}

export function formatStatusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
