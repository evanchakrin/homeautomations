"use client";

import { format, isSameDay, isToday } from "date-fns";
import { weekDays } from "@/lib/dates";
import type { EventOccurrence } from "@/lib/recurrence";
import type { FamilyMember } from "@/lib/supabase/types";
import { TimeGrid } from "./TimeGrid";

export function WeekView({
  anchor, events, members, onSelectSlot, onSelectEvent,
}: {
  anchor: Date;
  events: EventOccurrence[];
  members: FamilyMember[];
  onSelectSlot: (d: Date) => void;
  onSelectEvent: (e: EventOccurrence) => void;
}) {
  const days = weekDays(anchor);
  return (
    <div className="card overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
        <div />
        {days.map((d) => (
          <div key={d.toISOString()} className="p-2 text-center border-l border-black/5">
            <div className="text-xs uppercase tracking-wide text-ink/50">{format(d, "EEE")}</div>
            <div className={`text-2xl font-display ${isToday(d) ? "text-accent" : ""}`}>{format(d, "d")}</div>
          </div>
        ))}
      </div>
      <TimeGrid
        days={days}
        events={events}
        members={members}
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
      />
    </div>
  );
}
