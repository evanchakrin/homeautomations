import type { Chore, Recurrence } from "@/lib/supabase/types";
import { isoDate } from "@/lib/dates";

export function isChoreDueOn(chore: Chore, day: Date): boolean {
  const dow = day.getDay();
  const dayStr = isoDate(day);

  switch (chore.recurrence as Recurrence) {
    case "daily": return true;
    case "weekdays": return dow >= 1 && dow <= 5;
    case "weekly":
      if (!chore.due_date) return false;
      return new Date(chore.due_date).getDay() === dow;
    case "monthly":
      if (!chore.due_date) return false;
      return new Date(chore.due_date).getDate() === day.getDate();
    case "once":
    default:
      return chore.due_date === dayStr;
  }
}
