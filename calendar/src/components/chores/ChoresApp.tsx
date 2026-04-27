"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { Chore, ChoreCompletion, FamilyMember } from "@/lib/supabase/types";
import { isoDate, plusDays } from "@/lib/dates";
import { isChoreDueOn } from "@/lib/chores";
import { hexToRgba } from "@/lib/colors";
import { ChoreDialog } from "./ChoreDialog";
import { toggleChoreAction, deleteChoreAction } from "@/app/(app)/chores/actions";

export function ChoresApp({
  members, chores, completions,
}: {
  members: FamilyMember[];
  chores: Chore[];
  completions: ChoreCompletion[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Chore | "new" | null>(null);
  const [pending, startTransition] = useTransition();
  const memberById = new Map(members.map((m) => [m.id, m]));

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => plusDays(today, i));

  const completedSet = useMemo(() => {
    const s = new Set<string>();
    for (const c of completions) s.add(`${c.chore_id}:${c.completed_on}`);
    return s;
  }, [completions]);

  function toggle(chore: Chore, day: Date) {
    const onDate = isoDate(day);
    startTransition(async () => {
      await toggleChoreAction(chore.id, onDate, chore.member_id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Chores</h1>
          <p className="text-ink/60 text-sm">Tap a square to mark done.</p>
        </div>
        <button onClick={() => setEditing("new")} className="btn btn-primary">+ New chore</button>
      </div>

      {/* Leaderboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {members.map((m) => (
          <div key={m.id} className="card p-4 text-center" style={{ borderTop: `4px solid ${m.color}` }}>
            <div
              className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white text-xl"
              style={{ background: m.color }}
            >
              {m.emoji || m.name[0]}
            </div>
            <div className="font-medium mt-2">{m.name}</div>
            <div className="text-ink/50 text-sm">{m.points} pts</div>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-ink/50 border-b border-black/5">
              <th className="text-left p-3 font-medium min-w-[200px]">Chore</th>
              <th className="text-left p-3 font-medium">Who</th>
              <th className="text-left p-3 font-medium">Pts</th>
              {days.map((d) => (
                <th key={d.toISOString()} className="p-3 font-medium text-center min-w-[60px]">
                  <div>{format(d, "EEE")}</div>
                  <div className="text-base font-display text-ink">{format(d, "d")}</div>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {chores.length === 0 && (
              <tr><td colSpan={11} className="p-8 text-center text-ink/50">No chores yet.</td></tr>
            )}
            {chores.map((c) => {
              const m = c.member_id ? memberById.get(c.member_id) : null;
              return (
                <tr key={c.id} className="border-b border-black/5 last:border-0">
                  <td className="p-3">
                    <button onClick={() => setEditing(c)} className="font-medium hover:underline text-left">{c.title}</button>
                    <div className="text-xs text-ink/50 capitalize">{c.recurrence}</div>
                  </td>
                  <td className="p-3">
                    {m ? (
                      <span className="chip" style={{ background: hexToRgba(m.color, 0.18), color: m.color }}>
                        {m.emoji} {m.name}
                      </span>
                    ) : <span className="text-ink/40 text-sm">Anyone</span>}
                  </td>
                  <td className="p-3 tabular-nums text-sm">{c.points}</td>
                  {days.map((d) => {
                    const due = isChoreDueOn(c, d);
                    const done = completedSet.has(`${c.id}:${isoDate(d)}`);
                    return (
                      <td key={d.toISOString()} className="p-2 text-center">
                        {due ? (
                          <button
                            disabled={pending}
                            onClick={() => toggle(c, d)}
                            className={`w-9 h-9 rounded-lg border-2 transition ${
                              done ? "bg-emerald-500 border-emerald-500 text-white" : "border-black/10 hover:bg-black/5"
                            }`}
                            aria-label={done ? "Mark undone" : "Mark done"}
                          >
                            {done ? "✓" : ""}
                          </button>
                        ) : (
                          <span className="text-ink/15">–</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-2">
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${c.title}"?`)) {
                          startTransition(async () => { await deleteChoreAction(c.id); router.refresh(); });
                        }
                      }}
                      className="btn btn-ghost text-ink/40 hover:text-red-600 px-2"
                      aria-label="Delete"
                    >×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <ChoreDialog
          members={members}
          chore={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
