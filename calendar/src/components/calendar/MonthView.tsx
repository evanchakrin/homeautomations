"use client";

import { format, isSameDay, isSameMonth, isToday } from "date-fns";
import type { EventOccurrence } from "@/lib/recurrence";
import type { FamilyMember } from "@/lib/supabase/types";
import { monthGrid } from "@/lib/dates";
import { EventChip } from "./EventChip";

export function MonthView({
  anchor, events, members, onSelectDate, onSelectEvent,
}: {
  anchor: Date;
  events: EventOccurrence[];
  members: FamilyMember[];
  onSelectDate: (d: Date) => void;
  onSelectEvent: (e: EventOccurrence) => void;
}) {
  const days = monthGrid(anchor);
  const memberById = new Map(members.map((m) => [m.id, m]));

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 text-xs uppercase tracking-wide text-ink/50 border-b border-black/5">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="p-2 text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6">
        {days.map((d) => {
          const dayEvents = events.filter((e) => isSameDay(e.occurrence_start, d)
            || (e.all_day && d >= e.occurrence_start && d <= e.occurrence_end));
          const inMonth = isSameMonth(d, anchor);
          const today = isToday(d);
          return (
            <div
              key={d.toISOString()}
              onClick={() => onSelectDate(d)}
              className={`min-h-[110px] border-t border-l border-black/5 p-2 cursor-pointer
                ${inMonth ? "bg-white" : "bg-paper/60"}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm ${today ? "font-bold" : "text-ink/70"}`}>
                  {today ? (
                    <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-ink text-paper">
                      {format(d, "d")}
                    </span>
                  ) : format(d, "d")}
                </span>
              </div>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 4).map((ev, i) => (
                  <EventChip
                    key={ev.id + i}
                    event={ev}
                    members={ev.member_ids.map((id) => memberById.get(id)).filter(Boolean) as FamilyMember[]}
                    onClick={(e) => { e.stopPropagation(); onSelectEvent(ev); }}
                    compact
                  />
                ))}
                {dayEvents.length > 4 && (
                  <div className="text-xs text-ink/50 px-1">+{dayEvents.length - 4} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
