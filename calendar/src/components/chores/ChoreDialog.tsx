"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Chore, FamilyMember, Recurrence } from "@/lib/supabase/types";
import { createChoreAction, updateChoreAction } from "@/app/(app)/chores/actions";

const RECS: { v: Recurrence; label: string }[] = [
  { v: "once", label: "One time" },
  { v: "daily", label: "Every day" },
  { v: "weekdays", label: "Weekdays" },
  { v: "weekly", label: "Weekly" },
  { v: "monthly", label: "Monthly" },
];

export function ChoreDialog({
  members, chore, onClose,
}: {
  members: FamilyMember[];
  chore?: Chore;
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(chore?.title ?? "");
  const [memberId, setMemberId] = useState<string | "">(chore?.member_id ?? "");
  const [points, setPoints] = useState<number>(chore?.points ?? 0);
  const [recurrence, setRecurrence] = useState<Recurrence>(chore?.recurrence ?? "once");
  const [dueDate, setDueDate] = useState<string>(chore?.due_date ?? "");
  const [notes, setNotes] = useState<string>(chore?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function esc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  function submit() {
    setError(null);
    if (!title.trim()) return setError("Title required.");
    const payload = {
      title: title.trim(),
      member_id: memberId || null,
      points,
      recurrence,
      due_date: dueDate || null,
      notes: notes || null,
    };
    startTransition(async () => {
      const res = chore
        ? await updateChoreAction(chore.id, payload)
        : await createChoreAction(payload);
      if (res?.error) setError(res.error);
      else { onClose(); router.refresh(); }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-2xl">{chore ? "Edit chore" : "New chore"}</h2>

        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Assigned to</label>
            <select className="input" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              <option value="">Anyone</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Points</label>
            <input
              type="number" min={0} max={1000}
              className="input" value={points}
              onChange={(e) => setPoints(parseInt(e.target.value || "0", 10))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Repeats</label>
            <select className="input" value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}>
              {RECS.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{recurrence === "once" ? "Due date" : "Anchor date"}</label>
            <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn">Cancel</button>
          <button onClick={submit} disabled={pending} className="btn btn-primary">
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
