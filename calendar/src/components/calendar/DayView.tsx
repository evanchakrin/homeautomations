"use client";

import { format } from "date-fns";
import type { EventOccurrence } from "@/lib/recurrence";
import type { FamilyMember } from "@/lib/supabase/types";
import { TimeGrid } from "./TimeGrid";

export function DayView({
  anchor, events, members, onSelectSlot, onSelectEvent,
}: {
  anchor: Date;
  events: EventOccurrence[];
  members: FamilyMember[];
  onSelectSlot: (d: Date) => void;
  onSelectEvent: (e: EventOccurrence) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="p-3 border-b border-black/5 text-center">
        <div className="text-xs uppercase tracking-wide text-ink/50">{format(anchor, "EEEE")}</div>
        <div className="font-display text-3xl">{format(anchor, "LLLL d")}</div>
      </div>
      <TimeGrid
        days={[anchor]}
        events={events}
        members={members}
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
      />
    </div>
  );
}
