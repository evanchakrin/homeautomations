"use client";

import { format, isSameDay, startOfDay } from "date-fns";
import type { EventOccurrence } from "@/lib/recurrence";
import type { FamilyMember } from "@/lib/supabase/types";
import { hexToRgba } from "@/lib/colors";

export function ScheduleView({
  events, members, onSelectEvent,
}: {
  events: EventOccurrence[];
  members: FamilyMember[];
  onSelectEvent: (e: EventOccurrence) => void;
}) {
  const memberById = new Map(members.map((m) => [m.id, m]));
  const groups = new Map<string, EventOccurrence[]>();
  for (const e of events) {
    const key = format(startOfDay(e.occurrence_start), "yyyy-MM-dd");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  if (groups.size === 0) {
    return <div className="card p-12 text-center text-ink/50">No events.</div>;
  }

  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([key, list]) => {
        const d = new Date(key);
        const today = isSameDay(d, new Date());
        return (
          <div key={key} className="card p-4">
            <div className="flex items-baseline gap-3 mb-3">
              <div className="font-display text-2xl">{format(d, "EEE, LLL d")}</div>
              {today && <span className="chip bg-accent/15 text-accent">Today</span>}
            </div>
            <div className="space-y-2">
              {list.map((ev) => {
                const m = ev.member_ids.map((id) => memberById.get(id)).filter(Boolean) as FamilyMember[];
                const color = m[0]?.color ?? "#3D5A80";
                return (
                  <button
                    key={ev.id + key}
                    onClick={() => onSelectEvent(ev)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-paper transition border-l-4"
                    style={{ borderColor: color, background: hexToRgba(color, 0.06) }}
                  >
                    <div className="w-20 text-sm text-ink/60 tabular-nums">
                      {ev.all_day ? "All day" : format(ev.occurrence_start, "h:mm a")}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{ev.title}</div>
                      {ev.location && <div className="text-xs text-ink/50">{ev.location}</div>}
                    </div>
                    <div className="flex -space-x-1.5">
                      {m.map((mem) => (
                        <span
                          key={mem.id}
                          className="w-6 h-6 rounded-full border-2 border-white text-[10px] flex items-center justify-center text-white"
                          style={{ background: mem.color }}
                          title={mem.name}
                        >
                          {mem.emoji || mem.name[0]}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
