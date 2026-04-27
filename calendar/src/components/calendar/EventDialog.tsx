"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addHours, format, parse } from "date-fns";
import type { EventWithAssignees, FamilyMember } from "@/lib/supabase/types";
import { buildRRule, parseRecurrence } from "@/lib/recurrence";
import { createEventAction, updateEventAction, deleteEventAction } from "@/app/(app)/calendar/actions";

const RECURRENCE_OPTS = [
  { v: "none", label: "Does not repeat" },
  { v: "daily", label: "Daily" },
  { v: "weekdays", label: "Weekdays" },
  { v: "weekly", label: "Weekly" },
  { v: "monthly", label: "Monthly" },
  { v: "yearly", label: "Yearly" },
] as const;

type RecurrenceV = typeof RECURRENCE_OPTS[number]["v"];

export function EventDialog({
  householdId: _householdId, members, event, defaultDate, onClose,
}: {
  householdId: string;
  members: FamilyMember[];
  event?: EventWithAssignees;
  defaultDate?: Date;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = !!event;
  const initialStart = event ? new Date(event.starts_at) : (defaultDate ?? new Date());
  const initialEnd = event ? new Date(event.ends_at) : addHours(initialStart, 1);

  const [title, setTitle] = useState(event?.title ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [startStr, setStartStr] = useState(format(initialStart, allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm"));
  const [endStr, setEndStr] = useState(format(initialEnd, allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm"));
  const [memberIds, setMemberIds] = useState<string[]>(event?.member_ids ?? []);
  const [recurrence, setRecurrence] = useState<RecurrenceV>(parseRecurrence(event?.rrule ?? null) as RecurrenceV);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function esc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  function handleAllDay(next: boolean) {
    if (next) {
      setStartStr((s) => s.slice(0, 10));
      setEndStr((s) => s.slice(0, 10));
    } else {
      setStartStr((s) => s.length === 10 ? `${s}T09:00` : s);
      setEndStr((s) => s.length === 10 ? `${s}T10:00` : s);
    }
    setAllDay(next);
  }

  function toggleMember(id: string) {
    setMemberIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  }

  function submit() {
    setError(null);
    if (!title.trim()) return setError("Title required.");
    const startDate = allDay
      ? parse(startStr, "yyyy-MM-dd", new Date())
      : parse(startStr, "yyyy-MM-dd'T'HH:mm", new Date());
    const endDate = allDay
      ? parse(endStr, "yyyy-MM-dd", new Date())
      : parse(endStr, "yyyy-MM-dd'T'HH:mm", new Date());
    if (endDate < startDate) return setError("End must be after start.");

    const payload = {
      title: title.trim(),
      description: description || null,
      location: location || null,
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
      all_day: allDay,
      rrule: buildRRule(recurrence),
      category: null,
      member_ids: memberIds,
    };

    startTransition(async () => {
      const res = isEdit && event
        ? await updateEventAction(event.id, payload)
        : await createEventAction(payload);
      if (res?.error) setError(res.error);
      else { onClose(); router.refresh(); }
    });
  }

  function remove() {
    if (!event) return;
    if (!confirm("Delete this event?")) return;
    startTransition(async () => {
      const res = await deleteEventAction(event.id);
      if (res?.error) setError(res.error);
      else { onClose(); router.refresh(); }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">{isEdit ? "Edit event" : "New event"}</h2>
          <button onClick={onClose} className="btn btn-ghost px-2">×</button>
        </div>

        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="allday" checked={allDay} onChange={(e) => handleAllDay(e.target.checked)} />
          <label htmlFor="allday" className="text-sm">All day</label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Starts</label>
            <input
              type={allDay ? "date" : "datetime-local"}
              className="input"
              value={startStr}
              onChange={(e) => setStartStr(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Ends</label>
            <input
              type={allDay ? "date" : "datetime-local"}
              className="input"
              value={endStr}
              onChange={(e) => setEndStr(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Repeats</label>
          <select className="input" value={recurrence} onChange={(e) => setRecurrence(e.target.value as RecurrenceV)}>
            {RECURRENCE_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Location</label>
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input min-h-[60px]" value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <label className="label">Who</label>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const on = memberIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className="chip border"
                  style={{
                    borderColor: m.color,
                    background: on ? m.color : "transparent",
                    color: on ? "white" : "rgba(15,23,42,0.7)",
                  }}
                >
                  {m.emoji && <span>{m.emoji}</span>}
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          {isEdit ? (
            <button onClick={remove} className="btn text-red-600 border-red-200 hover:bg-red-50">Delete</button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn">Cancel</button>
            <button onClick={submit} disabled={pending} className="btn btn-primary">
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
