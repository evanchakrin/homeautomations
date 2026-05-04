"use client";

import { format, isSameDay, startOfDay, addMinutes, differenceInMinutes } from "date-fns";
import type { EventOccurrence } from "@/lib/recurrence";
import type { FamilyMember } from "@/lib/supabase/types";
import { hexToRgba } from "@/lib/colors";

export const HOUR_HEIGHT = 56;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function TimeGrid({
  days, events, members, onSelectSlot, onSelectEvent,
}: {
  days: Date[];
  events: EventOccurrence[];
  members: FamilyMember[];
  onSelectSlot: (d: Date) => void;
  onSelectEvent: (e: EventOccurrence) => void;
}) {
  const memberById = new Map(members.map((m) => [m.id, m]));
  const allDay = events.filter((e) => e.all_day);

  return (
    <div>
      {allDay.length > 0 && (
        <div className="grid border-b border-black/5" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}>
          <div className="p-2 text-[10px] uppercase tracking-wide text-ink/40 text-right pr-2">All-day</div>
          {days.map((d) => {
            const items = allDay.filter((e) =>
              d >= startOfDay(e.occurrence_start) && d <= startOfDay(e.occurrence_end));
            return (
              <div key={d.toISOString()} className="border-l border-black/5 p-1 space-y-1">
                {items.map((ev) => {
                  const m = ev.member_ids.map((id) => memberById.get(id)).filter(Boolean) as FamilyMember[];
                  const color = m[0]?.color ?? "#3D5A80";
                  return (
                    <button
                      key={ev.id + d.toISOString()}
                      onClick={() => onSelectEvent(ev)}
                      className="w-full text-left text-xs px-2 py-1 rounded-md truncate"
                      style={{ background: hexToRgba(color, 0.18), color: "#0F172A" }}
                    >
                      {ev.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid relative" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}>
        <div>
          {HOURS.map((h) => (
            <div key={h} style={{ height: HOUR_HEIGHT }} className="text-[10px] uppercase text-ink/40 text-right pr-2 -mt-1.5">
              {h === 0 ? "" : format(new Date(2000, 0, 1, h), "ha").toLowerCase()}
            </div>
          ))}
        </div>
        {days.map((d) => {
          const dayEvents = events.filter((e) => !e.all_day && isSameDay(e.occurrence_start, d));
          return (
            <div key={d.toISOString()} className="relative border-l border-black/5">
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{ height: HOUR_HEIGHT }}
                  className="border-t border-black/5 hover:bg-paper/50 cursor-pointer"
                  onClick={() => onSelectSlot(addMinutes(startOfDay(d), h * 60))}
                />
              ))}
              {dayEvents.map((ev) => {
                const top = (differenceInMinutes(ev.occurrence_start, startOfDay(d)) / 60) * HOUR_HEIGHT;
                const height = Math.max(
                  20,
                  (differenceInMinutes(ev.occurrence_end, ev.occurrence_start) / 60) * HOUR_HEIGHT - 2,
                );
                const m = ev.member_ids.map((id) => memberById.get(id)).filter(Boolean) as FamilyMember[];
                const color = m[0]?.color ?? "#3D5A80";
                return (
                  <button
                    key={ev.id + d.toISOString()}
                    onClick={(e) => { e.stopPropagation(); onSelectEvent(ev); }}
                    className="absolute left-1 right-1 rounded-md border-l-2 px-2 py-1 text-left text-xs overflow-hidden"
                    style={{
                      top, height,
                      background: hexToRgba(color, 0.18),
                      borderColor: color,
                      color: "#0F172A",
                    }}
                  >
                    <div className="font-semibold truncate">{ev.title}</div>
                    <div className="opacity-60">{format(ev.occurrence_start, "h:mma").toLowerCase()}</div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
