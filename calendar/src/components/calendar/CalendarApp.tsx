"use client";

import { useMemo, useState } from "react";
import {
  format, addMonths, addWeeks, addDays, startOfMonth, startOfWeek, startOfDay,
} from "date-fns";
import type { EventWithAssignees, FamilyMember } from "@/lib/supabase/types";
import { expandEvents } from "@/lib/recurrence";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import { ScheduleView } from "./ScheduleView";
import { EventDialog } from "./EventDialog";
import { MemberFilter } from "./MemberFilter";

type View = "month" | "week" | "day" | "schedule";

export function CalendarApp({
  householdId, members, events,
}: {
  householdId: string;
  members: FamilyMember[];
  events: EventWithAssignees[];
}) {
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [activeMembers, setActiveMembers] = useState<string[]>(members.map((m) => m.id));
  const [editing, setEditing] = useState<{ event?: EventWithAssignees; defaultDate?: Date } | null>(null);

  const range = useMemo(() => {
    if (view === "month") {
      const start = startOfMonth(anchor);
      const end = addMonths(start, 1);
      return { start, end };
    }
    if (view === "week") {
      const start = startOfWeek(anchor, { weekStartsOn: 0 });
      return { start, end: addWeeks(start, 1) };
    }
    if (view === "day") {
      const start = startOfDay(anchor);
      return { start, end: addDays(start, 1) };
    }
    const start = startOfDay(anchor);
    return { start, end: addDays(start, 30) };
  }, [view, anchor]);

  const visibleEvents = useMemo(() => {
    const filtered = events.filter((e) => {
      if (e.member_ids.length === 0) return true;
      return e.member_ids.some((m) => activeMembers.includes(m));
    });
    return expandEvents(filtered, addDays(range.start, -7), addDays(range.end, 7));
  }, [events, activeMembers, range]);

  function shift(delta: number) {
    if (view === "month") setAnchor((d) => addMonths(d, delta));
    else if (view === "week") setAnchor((d) => addWeeks(d, delta));
    else if (view === "day") setAnchor((d) => addDays(d, delta));
    else setAnchor((d) => addDays(d, delta * 7));
  }

  const heading = useMemo(() => {
    if (view === "month") return format(anchor, "LLLL yyyy");
    if (view === "week") {
      const s = startOfWeek(anchor, { weekStartsOn: 0 });
      const e = addDays(s, 6);
      return `${format(s, "LLL d")} – ${format(e, "LLL d, yyyy")}`;
    }
    if (view === "day") return format(anchor, "EEEE, LLL d, yyyy");
    return `Next 30 days from ${format(anchor, "LLL d")}`;
  }, [view, anchor]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => shift(-1)} className="btn btn-ghost px-3">‹</button>
          <button onClick={() => setAnchor(new Date())} className="btn btn-ghost text-sm">Today</button>
          <button onClick={() => shift(1)} className="btn btn-ghost px-3">›</button>
        </div>
        <h1 className="font-display text-3xl">{heading}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ViewSwitch view={view} onChange={setView} />
          <button onClick={() => setEditing({ defaultDate: anchor })} className="btn btn-primary">+ New event</button>
        </div>
      </div>

      <MemberFilter members={members} active={activeMembers} onChange={setActiveMembers} />

      {view === "month" && (
        <MonthView
          anchor={anchor}
          events={visibleEvents}
          members={members}
          onSelectDate={(d) => setEditing({ defaultDate: d })}
          onSelectEvent={(e) => setEditing({ event: events.find((x) => x.id === e.id) })}
        />
      )}
      {view === "week" && (
        <WeekView
          anchor={anchor}
          events={visibleEvents}
          members={members}
          onSelectSlot={(d) => setEditing({ defaultDate: d })}
          onSelectEvent={(e) => setEditing({ event: events.find((x) => x.id === e.id) })}
        />
      )}
      {view === "day" && (
        <DayView
          anchor={anchor}
          events={visibleEvents}
          members={members}
          onSelectSlot={(d) => setEditing({ defaultDate: d })}
          onSelectEvent={(e) => setEditing({ event: events.find((x) => x.id === e.id) })}
        />
      )}
      {view === "schedule" && (
        <ScheduleView
          events={visibleEvents}
          members={members}
          onSelectEvent={(e) => setEditing({ event: events.find((x) => x.id === e.id) })}
        />
      )}

      {editing && (
        <EventDialog
          householdId={householdId}
          members={members}
          event={editing.event}
          defaultDate={editing.defaultDate}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ViewSwitch({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const opts: { v: View; label: string }[] = [
    { v: "month", label: "Month" },
    { v: "week", label: "Week" },
    { v: "day", label: "Day" },
    { v: "schedule", label: "Schedule" },
  ];
  return (
    <div className="inline-flex rounded-xl border border-black/10 bg-white p-1">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`px-3 py-1.5 text-sm rounded-lg ${
            view === o.v ? "bg-ink text-paper" : "hover:bg-black/5 text-ink/70"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
