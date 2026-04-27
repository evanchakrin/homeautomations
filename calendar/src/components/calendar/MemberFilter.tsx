"use client";

import type { FamilyMember } from "@/lib/supabase/types";
import { hexToRgba } from "@/lib/colors";

export function MemberFilter({
  members, active, onChange,
}: {
  members: FamilyMember[];
  active: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(active.includes(id) ? active.filter((x) => x !== id) : [...active, id]);
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {members.map((m) => {
        const on = active.includes(m.id);
        return (
          <button
            key={m.id}
            onClick={() => toggle(m.id)}
            className="chip transition border"
            style={{
              borderColor: m.color,
              background: on ? hexToRgba(m.color, 0.18) : "transparent",
              color: on ? m.color : "rgba(15,23,42,0.5)",
            }}
          >
            {m.emoji && <span>{m.emoji}</span>}
            {m.name}
          </button>
        );
      })}
    </div>
  );
}
