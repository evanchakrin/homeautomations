"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PALETTE } from "@/lib/colors";
import { createHouseholdAction } from "./actions";

type DraftMember = { name: string; color: string; emoji: string };

export function OnboardingForm() {
  const router = useRouter();
  const [householdName, setHouseholdName] = useState("");
  const [timezone, setTimezone] = useState(
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Los_Angeles",
  );
  const [members, setMembers] = useState<DraftMember[]>([
    { name: "", color: PALETTE[0], emoji: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateMember(i: number, patch: Partial<DraftMember>) {
    setMembers((m) => m.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  function addMember() {
    const used = members.map((m) => m.color);
    const color = PALETTE.find((c) => !used.includes(c)) ?? PALETTE[0];
    setMembers((m) => [...m, { name: "", color, emoji: "" }]);
  }

  function removeMember(i: number) {
    setMembers((m) => m.filter((_, j) => j !== i));
  }

  function submit() {
    setError(null);
    const filtered = members.filter((m) => m.name.trim().length > 0);
    if (!householdName.trim()) return setError("Give your family a name.");
    if (filtered.length === 0) return setError("Add at least one family member.");
    startTransition(async () => {
      const res = await createHouseholdAction({
        name: householdName.trim(),
        timezone,
        members: filtered,
      });
      if (res?.error) setError(res.error);
      else router.push("/calendar");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="label">Family name</label>
        <input
          className="input"
          placeholder="The Smiths"
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Time zone</label>
        <input className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl">Family members</h2>
          <button onClick={addMember} className="btn btn-ghost text-sm">+ Add member</button>
        </div>
        <div className="space-y-3">
          {members.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <ColorPicker value={m.color} onChange={(c) => updateMember(i, { color: c })} />
              <input
                className="input flex-1"
                placeholder="Name"
                value={m.name}
                onChange={(e) => updateMember(i, { name: e.target.value })}
              />
              <input
                className="input w-20 text-center"
                placeholder="emoji"
                maxLength={2}
                value={m.emoji}
                onChange={(e) => updateMember(i, { emoji: e.target.value })}
              />
              {members.length > 1 && (
                <button
                  className="btn btn-ghost px-2"
                  aria-label="Remove"
                  onClick={() => removeMember(i)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={submit} disabled={pending} className="btn btn-primary w-full">
        {pending ? "Creating…" : "Create family"}
      </button>
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
        aria-label="Choose color"
      />
      {open && (
        <div className="absolute top-12 left-0 z-20 card p-2 grid grid-cols-5 gap-1 w-48">
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
