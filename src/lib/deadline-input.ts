import { format } from "date-fns";

/** Local `yyyy-MM-dd'T'HH:mm` for DateTimePicker and server actions. */
export function toLocalDateTimeValue(date: Date | string): string {
  return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
}
