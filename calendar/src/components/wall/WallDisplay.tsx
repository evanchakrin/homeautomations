"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import type {
  EventWithAssignees, FamilyMember, Chore, ChoreCompletion, Meal, List, ListItem, Photo,
} from "@/lib/supabase/types";
import { expandEvents } from "@/lib/recurrence";
import { isChoreDueOn } from "@/lib/chores";
import { isoDate, plusDays } from "@/lib/dates";
import { hexToRgba } from "@/lib/colors";

type PhotoSigned = Photo & { signedUrl: string | null };

export function WallDisplay({
  household, members, events, chores, completions, meals, lists, listItems, photos,
}: {
  household: { id: string; name: string; timezone: string };
  members: FamilyMember[];
  events: EventWithAssignees[];
  chores: Chore[];
  completions: ChoreCompletion[];
  meals: Meal[];
  lists: List[];
  listItems: Record<string, ListItem[]>;
  photos: PhotoSigned[];
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => window.location.reload(), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => plusDays(now, i)), [now]);
  const expanded = useMemo(
    () => expandEvents(events, plusDays(now, -1), plusDays(now, 8)),
    [events, now],
  );
  const memberById = new Map(members.map((m) => [m.id, m]));
  const completedSet = new Set(completions.map((c) => `${c.chore_id}:${c.completed_on}`));
  const todayChores = chores.filter((c) => isChoreDueOn(c, now));

  return (
    <div className="min-h-screen w-full bg-paper text-ink p-6">
      <header className="flex items-end justify-between mb-6">
        <div>
          <div className="text-ink/50 uppercase tracking-widest text-sm">{format(now, "EEEE")}</div>
          <h1 className="font-display text-6xl leading-none">{format(now, "LLLL d")}</h1>
          <div className="text-ink/60 mt-1">{household.name}</div>
        </div>
        <div className="font-display text-7xl tabular-nums">{format(now, "h:mm")}<span className="text-3xl ml-2 align-top">{format(now, "a").toLowerCase()}</span></div>
      </header>

      <div className="grid grid-cols-12 gap-5">
        {/* week strip */}
        <section className="col-span-12 grid grid-cols-7 gap-3">
          {days.map((d) => {
            const dayEvents = expanded.filter((e) => isSameDay(e.occurrence_start, d)
              || (e.all_day && d >= e.occurrence_start && d <= e.occurrence_end));
            const isToday = isSameDay(d, now);
            return (
              <div key={d.toISOString()} className={`card p-3 min-h-[180px] ${isToday ? "ring-2 ring-ink" : ""}`}>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-xs uppercase tracking-wide text-ink/50">{format(d, "EEE")}</div>
                  <div className="font-display text-2xl">{format(d, "d")}</div>
                </div>
                <ul className="space-y-1">
                  {dayEvents.slice(0, 5).map((ev, i) => {
                    const m = ev.member_ids.map((id) => memberById.get(id)).filter(Boolean) as FamilyMember[];
                    const color = m[0]?.color ?? "#3D5A80";
                    return (
                      <li
                        key={ev.id + i}
                        className="text-xs px-2 py-1 rounded-md border-l-2 truncate"
                        style={{ background: hexToRgba(color, 0.15), borderColor: color }}
                      >
                        {!ev.all_day && (
                          <span className="opacity-60 mr-1">
                            {format(ev.occurrence_start, "h:mma").toLowerCase().replace(":00","")}
                          </span>
                        )}
                        {ev.title}
                      </li>
                    );
                  })}
                  {dayEvents.length > 5 && <li className="text-[10px] text-ink/40">+{dayEvents.length - 5} more</li>}
                </ul>
              </div>
            );
          })}
        </section>

        {/* today's chores */}
        <section className="card p-5 col-span-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-2xl">Today&apos;s chores</h2>
            <span className="text-ink/40 text-sm">{format(now, "EEE")}</span>
          </div>
          {todayChores.length === 0 ? (
            <p className="text-ink/50">All clear today.</p>
          ) : (
            <ul className="space-y-2">
              {todayChores.map((c) => {
                const m = c.member_id ? memberById.get(c.member_id) : null;
                const done = completedSet.has(`${c.id}:${isoDate(now)}`);
                return (
                  <li key={c.id} className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs ${
                        done ? "bg-emerald-500 border-emerald-500 text-white" : "border-black/20"
                      }`}
                    >{done ? "✓" : ""}</span>
                    <span className={`flex-1 ${done ? "line-through text-ink/40" : ""}`}>{c.title}</span>
                    {m && (
                      <span className="chip" style={{ background: hexToRgba(m.color, 0.2), color: m.color }}>
                        {m.emoji} {m.name}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* meals this week */}
        <section className="card p-5 col-span-4">
          <h2 className="font-display text-2xl mb-3">This week&apos;s meals</h2>
          <ul className="space-y-2">
            {days.slice(0, 5).map((d) => {
              const key = isoDate(d);
              const dinner = meals.find((m) => m.date === key && m.meal_type === "dinner");
              return (
                <li key={key} className="flex items-center gap-3 text-sm">
                  <span className="w-12 text-ink/50 uppercase tracking-wide text-xs">{format(d, "EEE")}</span>
                  <span className="flex-1">{dinner?.title || <span className="text-ink/30">—</span>}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* lists snapshot */}
        <section className="card p-5 col-span-4">
          <h2 className="font-display text-2xl mb-3">Lists</h2>
          <div className="grid grid-cols-2 gap-3">
            {lists.slice(0, 4).map((l) => {
              const open = (listItems[l.id] ?? []).filter((i) => !i.completed_at).slice(0, 4);
              return (
                <div key={l.id}>
                  <div className="text-xs uppercase tracking-wide text-ink/50 mb-1">{l.name}</div>
                  <ul className="space-y-0.5 text-sm">
                    {open.length === 0 && <li className="text-ink/30">empty</li>}
                    {open.map((i) => <li key={i.id} className="truncate">· {i.text}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* photo slideshow */}
        {photos.length > 0 && (
          <section className="col-span-12 mt-1">
            <Slideshow photos={photos} />
          </section>
        )}
      </div>
    </div>
  );
}

function Slideshow({ photos }: { photos: PhotoSigned[] }) {
  const usable = photos.filter((p) => p.signedUrl);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (usable.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % usable.length), 12_000);
    return () => clearInterval(t);
  }, [usable.length]);
  if (usable.length === 0) return null;
  const p = usable[idx];
  return (
    <div className="card overflow-hidden h-72 relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={p.id}
        src={p.signedUrl!}
        alt={p.caption ?? ""}
        className="w-full h-full object-cover"
      />
      {p.caption && (
        <div className="absolute bottom-3 left-3 right-3 bg-black/40 text-white px-3 py-1 rounded-lg text-sm">
          {p.caption}
        </div>
      )}
    </div>
  );
}
