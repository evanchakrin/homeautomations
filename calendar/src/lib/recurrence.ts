import { RRule, rrulestr } from "rrule";
import type { Event, EventWithAssignees } from "@/lib/supabase/types";

export type EventOccurrence = EventWithAssignees & {
  occurrence_start: Date;
  occurrence_end: Date;
};

export function expandEvents(
  events: EventWithAssignees[],
  rangeStart: Date,
  rangeEnd: Date,
): EventOccurrence[] {
  const out: EventOccurrence[] = [];
  for (const ev of events) {
    const start = new Date(ev.starts_at);
    const end = new Date(ev.ends_at);
    const durationMs = end.getTime() - start.getTime();

    if (!ev.rrule) {
      if (end >= rangeStart && start <= rangeEnd) {
        out.push({ ...ev, occurrence_start: start, occurrence_end: end });
      }
      continue;
    }

    let rule: RRule;
    try {
      rule = rrulestr(ev.rrule, { dtstart: start }) as RRule;
    } catch {
      out.push({ ...ev, occurrence_start: start, occurrence_end: end });
      continue;
    }
    const dates = rule.between(rangeStart, rangeEnd, true);
    for (const d of dates) {
      out.push({
        ...ev,
        occurrence_start: d,
        occurrence_end: new Date(d.getTime() + durationMs),
      });
    }
  }
  out.sort((a, b) => a.occurrence_start.getTime() - b.occurrence_start.getTime());
  return out;
}

export function buildRRule(
  recurrence: "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly",
): string | null {
  switch (recurrence) {
    case "none": return null;
    case "daily": return "RRULE:FREQ=DAILY";
    case "weekdays": return "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR";
    case "weekly": return "RRULE:FREQ=WEEKLY";
    case "monthly": return "RRULE:FREQ=MONTHLY";
    case "yearly": return "RRULE:FREQ=YEARLY";
  }
}

export function parseRecurrence(rrule: string | null): string {
  if (!rrule) return "none";
  if (rrule.includes("FREQ=DAILY")) return "daily";
  if (rrule.includes("BYDAY=MO,TU,WE,TH,FR")) return "weekdays";
  if (rrule.includes("FREQ=WEEKLY")) return "weekly";
  if (rrule.includes("FREQ=MONTHLY")) return "monthly";
  if (rrule.includes("FREQ=YEARLY")) return "yearly";
  return "none";
}

export type EventInput = Omit<Event, "id" | "created_at" | "household_id" | "created_by">;
