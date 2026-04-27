import {
  addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek,
  format, isSameDay, isSameMonth, isWithinInterval, parseISO,
  startOfDay, startOfMonth, startOfWeek,
} from "date-fns";

export const fmt = format;
export const dayOf = startOfDay;
export const sameDay = isSameDay;
export const sameMonth = isSameMonth;
export const within = isWithinInterval;
export const parse = parseISO;
export const plusDays = addDays;
export const plusMonths = addMonths;

export function monthGrid(anchor: Date) {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function weekDays(anchor: Date) {
  const start = startOfWeek(anchor, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromIsoDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
