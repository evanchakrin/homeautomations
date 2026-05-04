"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { differenceInMinutes, format, isSameDay, isToday, startOfDay } from "date-fns";
import type {
  EventWithAssignees, FamilyMember, Chore, ChoreCompletion, Meal, List, ListItem, Photo, Note,
} from "@/lib/supabase/types";
import { expandEvents } from "@/lib/recurrence";
import { isChoreDueOn } from "@/lib/chores";
import { isoDate, plusDays } from "@/lib/dates";
import { hexToRgba } from "@/lib/colors";
import { HOUR_HEIGHT, TimeGrid } from "@/components/calendar/TimeGrid";

type PhotoSigned = Photo & { signedUrl: string | null };

export function WallDisplay({
  household, members, events, chores, completions, meals, lists, listItems, photos, notes = [],
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
  notes?: Note[];
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
    <div className="min-h-screen w-full bg-paper text-ink">
      <section className="min-h-screen px-6 py-6 flex flex-col">
        <header className="flex items-end justify-between mb-6">
          <div>
            <div className="text-ink/50 uppercase tracking-widest text-sm">{format(now, "EEEE")}</div>
            <h1 className="font-display text-6xl leading-none">{format(now, "LLLL d")}</h1>
            <div className="text-ink/60 mt-1">{household.name}</div>
          </div>
          <div className="font-display text-7xl tabular-nums">{format(now, "h:mm")}<span className="text-3xl ml-2 align-top">{format(now, "a").toLowerCase()}</span></div>
        </header>

        <RollingWeekCalendar days={days} events={expanded} members={members} now={now} />
      </section>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-12 gap-5">
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

          {/* notes */}
          {notes.length > 0 && (
            <section className="card p-5 col-span-12">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-2xl">Notes</h2>
                <span className="text-ink/40 text-sm">{notes.length} on the board</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...notes]
                  .sort((a, b) => Number(b.pinned) - Number(a.pinned))
                  .slice(0, 8)
                  .map((n) => {
                    const author = n.author_member_id ? memberById.get(n.author_member_id) : null;
                    const color = n.color ?? author?.color ?? "#3D5A80";
                    return (
                      <div
                        key={n.id}
                        className="rounded-xl p-3 border-l-4"
                        style={{ background: `${color}1f`, borderColor: color }}
                      >
                        <div className="text-[10px] uppercase tracking-wide text-ink/50 mb-1">
                          {author?.name ?? "Anon"}{n.pinned ? " · pinned" : ""}
                        </div>
                        <div className="text-sm whitespace-pre-wrap line-clamp-4">{n.body}</div>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* photo slideshow */}
          {photos.length > 0 && (
            <section className="col-span-12 mt-1">
              <Slideshow photos={photos} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function RollingWeekCalendar({
  days, events, members, now,
}: {
  days: Date[];
  events: ReturnType<typeof expandEvents>;
  members: FamilyMember[];
  now: Date;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const currentMinutes = differenceInMinutes(now, startOfDay(now));
    const target = (currentMinutes / 60) * HOUR_HEIGHT - scroller.clientHeight * 0.2;
    scroller.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [now]);

  return (
    <section className="card flex-1 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
        <div>
          <h2 className="font-display text-3xl">Next 7 days</h2>
          <p className="text-sm text-ink/50">Rolling week view for wall mode</p>
        </div>
        <div className="text-right text-sm text-ink/50">
          <div>{format(days[0], "LLL d")} – {format(days[days.length - 1], "LLL d")}</div>
          <div>Scroll for earlier and later times</div>
        </div>
      </div>

      <div ref={scrollerRef} className="h-full overflow-auto">
        <div className="min-w-[1120px]">
          <div className="grid sticky top-0 z-10 bg-paper/95 backdrop-blur-sm" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
            <div />
            {days.map((d) => (
              <div key={d.toISOString()} className="p-3 text-center border-l border-black/5">
                <div className="text-xs uppercase tracking-wide text-ink/50">{format(d, "EEE")}</div>
                <div className={`text-3xl font-display ${isToday(d) ? "text-accent" : ""}`}>{format(d, "d")}</div>
                <div className="text-xs text-ink/40">{format(d, "LLL")}</div>
              </div>
            ))}
          </div>
          <TimeGrid
            days={days}
            events={events.filter((e) => e.all_day || days.some((d) => isSameDay(e.occurrence_start, d)))}
            members={members}
            onSelectSlot={() => undefined}
            onSelectEvent={() => undefined}
          />
        </div>
      </div>
    </section>
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
