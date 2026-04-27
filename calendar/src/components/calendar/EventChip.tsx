"use client";

import { format } from "date-fns";
import type { EventOccurrence } from "@/lib/recurrence";
import type { FamilyMember } from "@/lib/supabase/types";
import { hexToRgba } from "@/lib/colors";

export function EventChip({
  event, members, onClick, compact = false,
}: {
  event: EventOccurrence;
  members: FamilyMember[];
  onClick: (e: React.MouseEvent) => void;
  compact?: boolean;
}) {
  const primary = members[0];
  const color = primary?.color ?? "#3D5A80";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-md border-l-2 truncate ${compact ? "text-[11px] px-1.5 py-0.5" : "text-sm px-2 py-1"}`}
      style={{
        background: hexToRgba(color, 0.15),
        borderColor: color,
        color: "#0F172A",
      }}
      title={event.title}
    >
      {!event.all_day && (
        <span className="opacity-60 mr-1">{format(event.occurrence_start, "h:mma").toLowerCase().replace(":00","")}</span>
      )}
      <span className="font-medium">{event.title}</span>
      {members.length > 1 && (
        <span className="ml-1 opacity-60">+{members.length - 1}</span>
      )}
    </button>
  );
}
