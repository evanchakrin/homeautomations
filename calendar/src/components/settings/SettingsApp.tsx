"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FamilyMember, Household } from "@/lib/supabase/types";
import { PALETTE } from "@/lib/colors";
import {
  updateHouseholdAction, addMemberAction, updateMemberAction,
  deleteMemberAction, resetPointsAction,
} from "@/app/(app)/settings/actions";

export function SettingsApp({
  household, members, role,
}: {
  household: Household;
  members: FamilyMember[];
  role: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(household.name);
  const [tz, setTz] = useState(household.timezone);
  const [error, setError] = useState<string | null>(null);

  function saveHousehold() {
    setError(null);
    startTransition(async () => {
      const res = await updateHouseholdAction({ name, timezone: tz });
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="text-ink/60 text-sm">You are signed in as {role}.</p>
      </div>

      <section className="card p-5 space-y-4">
        <h2 className="font-display text-xl">Household</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Time zone</label>
            <input className="input" value={tz} onChange={(e) => setTz(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={saveHousehold} disabled={pending} className="btn btn-primary">Save</button>
      </section>

      <section className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Family members</h2>
        </div>
        <div className="space-y-2">
          {members.map((m) => (
            <MemberRow key={m.id} member={m} onRefresh={() => router.refresh()} />
          ))}
          <NewMemberRow used={members.map((m) => m.color)} onRefresh={() => router.refresh()} />
        </div>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="font-display text-xl">Reset points</h2>
        <p className="text-ink/60 text-sm">Use at the end of a reward cycle.</p>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                if (confirm(`Reset ${m.name}'s points to 0?`)) {
                  startTransition(async () => { await resetPointsAction(m.id); router.refresh(); });
                }
              }}
              className="btn"
            >
              Reset {m.name} ({m.points})
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function MemberRow({ member, onRefresh }: { member: FamilyMember; onRefresh: () => void }) {
  const [name, setName] = useState(member.name);
  const [color, setColor] = useState(member.color);
  const [emoji, setEmoji] = useState(member.emoji ?? "");
  const [pending, startTransition] = useTransition();
  const dirty = name !== member.name || color !== member.color || (emoji || null) !== (member.emoji ?? null);

  function save() {
    startTransition(async () => {
      await updateMemberAction(member.id, { name, color, emoji });
      onRefresh();
    });
  }
  function remove() {
    if (!confirm(`Remove ${member.name}?`)) return;
    startTransition(async () => {
      await deleteMemberAction(member.id);
      onRefresh();
    });
  }
  return (
    <div className="flex items-center gap-2">
      <ColorPicker value={color} onChange={setColor} />
      <input className="input flex-1" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input w-20 text-center" maxLength={2} value={emoji} onChange={(e) => setEmoji(e.target.value)} />
      <button disabled={!dirty || pending} onClick={save} className="btn btn-primary disabled:opacity-40">Save</button>
      <button onClick={remove} className="btn btn-ghost text-ink/40 hover:text-red-600 px-2">×</button>
    </div>
  );
}

function NewMemberRow({ used, onRefresh }: { used: string[]; onRefresh: () => void }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState(PALETTE.find((c) => !used.includes(c)) ?? PALETTE[0]);
  const [pending, startTransition] = useTransition();

  function add() {
    if (!name.trim()) return;
    startTransition(async () => {
      await addMemberAction({ name, color, emoji });
      setName(""); setEmoji("");
      onRefresh();
    });
  }
  return (
    <div className="flex items-center gap-2">
      <ColorPicker value={color} onChange={setColor} />
      <input
        className="input flex-1"
        placeholder="Add a member"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") add(); }}
      />
      <input className="input w-20 text-center" maxLength={2} placeholder="emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
      <button disabled={pending || !name.trim()} onClick={add} className="btn btn-primary disabled:opacity-40">Add</button>
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-10 h-10 rounded-xl border border-black/10"
        style={{ background: value }}
        aria-label="Color"
      />
      {open && (
        <div className="absolute z-30 top-12 left-0 card p-2 grid grid-cols-5 gap-1 w-48">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { onChange(c); setOpen(false); }}
              className="w-7 h-7 rounded-md border border-black/10"
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>
      )}
    </div>
  );
}
