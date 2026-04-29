"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import type { FamilyMember, Note } from "@/lib/supabase/types";
import { hexToRgba } from "@/lib/colors";
import { createClient } from "@/lib/supabase/client";
import { createNoteAction, updateNoteAction, deleteNoteAction } from "@/app/(app)/notes/actions";

export function NotesApp({
  householdId, members, notes,
}: {
  householdId: string;
  members: FamilyMember[];
  notes: Note[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [authorId, setAuthorId] = useState<string>(members[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [liveBadge, setLiveBadge] = useState<"connecting" | "live" | "offline">("connecting");

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  // Realtime: refresh on any change to this household's notes
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notes:${householdId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes", filter: `household_id=eq.${householdId}` },
        () => router.refresh(),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setLiveBadge("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setLiveBadge("offline");
      });
    return () => { supabase.removeChannel(channel); };
  }, [householdId, router]);

  function submit() {
    setError(null);
    if (!body.trim()) return;
    const author = memberById.get(authorId);
    startTransition(async () => {
      const res = await createNoteAction({
        body: body.trim(),
        color: author?.color ?? null,
        author_member_id: authorId || null,
      });
      if (res?.error) { setError(res.error); return; }
      setBody("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl">Notes</h1>
          <p className="text-ink/60 text-sm">Family pinboard. Synced live across devices.</p>
        </div>
        <span className={`chip text-xs ${
          liveBadge === "live" ? "bg-emerald-100 text-emerald-700" :
          liveBadge === "offline" ? "bg-red-100 text-red-700" : "bg-paper text-ink/50"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            liveBadge === "live" ? "bg-emerald-500" :
            liveBadge === "offline" ? "bg-red-500" : "bg-ink/30"
          }`} />
          {liveBadge}
        </span>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setAuthorId(m.id)}
              className="chip border"
              style={{
                borderColor: m.color,
                background: authorId === m.id ? m.color : "transparent",
                color: authorId === m.id ? "white" : "rgba(15,23,42,0.7)",
              }}
            >
              {m.emoji && <span>{m.emoji}</span>}
              {m.name}
            </button>
          ))}
        </div>
        <textarea
          className="input min-h-[80px] resize-none"
          placeholder="Leave a note for the family…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink/40">⌘↵ to post</span>
          <button onClick={submit} disabled={pending || !body.trim()} className="btn btn-primary disabled:opacity-50">
            {pending ? "Posting…" : "Post"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {notes.length === 0 ? (
        <div className="card p-12 text-center text-ink/50">No notes yet. Leave the first one.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              member={n.author_member_id ? memberById.get(n.author_member_id) ?? null : null}
              onTogglePin={() => startTransition(async () => { await updateNoteAction(n.id, { pinned: !n.pinned }); router.refresh(); })}
              onSave={(body) => startTransition(async () => { await updateNoteAction(n.id, { body }); router.refresh(); })}
              onDelete={() => {
                if (!confirm("Delete this note?")) return;
                startTransition(async () => { await deleteNoteAction(n.id); router.refresh(); });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note, member, onTogglePin, onSave, onDelete,
}: {
  note: Note;
  member: FamilyMember | null;
  onTogglePin: () => void;
  onSave: (body: string) => void;
  onDelete: () => void;
}) {
  const color = note.color ?? member?.color ?? "#3D5A80";
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(note.body);
  return (
    <div
      className="card p-4 flex flex-col gap-2 group"
      style={{
        background: hexToRgba(color, 0.12),
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {member && (
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px]"
              style={{ background: color }}
              title={member.name}
            >
              {member.emoji || member.name[0]}
            </span>
          )}
          <span className="text-ink/60">
            {member?.name ?? "Anon"} · {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onTogglePin}
            className={`text-sm ${note.pinned ? "text-accent" : "text-ink/30 hover:text-ink"}`}
            title={note.pinned ? "Unpin" : "Pin"}
            aria-label={note.pinned ? "Unpin" : "Pin"}
          >
            {note.pinned ? "★" : "☆"}
          </button>
          <button onClick={() => setEditing((e) => !e)} className="text-xs text-ink/40 hover:text-ink">Edit</button>
          <button onClick={onDelete} className="text-ink/30 hover:text-red-600 px-1">×</button>
        </div>
      </div>
      {editing ? (
        <textarea
          className="input min-h-[80px]"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={() => { setEditing(false); if (body !== note.body) onSave(body); }}
          autoFocus
        />
      ) : (
        <p className="whitespace-pre-wrap leading-snug">{note.body}</p>
      )}
    </div>
  );
}
