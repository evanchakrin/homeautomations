"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { List, ListItem, ListKind } from "@/lib/supabase/types";
import {
  addItemAction, toggleItemAction, deleteItemAction,
  createListAction, renameListAction, deleteListAction, clearCompletedAction,
} from "@/app/(app)/lists/actions";

export function ListsApp({
  lists, items,
}: {
  lists: List[];
  items: Record<string, ListItem[]>;
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(lists[0]?.id ?? null);
  const [, startTransition] = useTransition();
  const [showNew, setShowNew] = useState(false);

  const active = lists.find((l) => l.id === activeId) ?? null;
  const activeItems = activeId ? items[activeId] ?? [] : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
      <aside className="space-y-1">
        {lists.map((l) => {
          const open = (items[l.id] ?? []).filter((i) => !i.completed_at).length;
          return (
            <button
              key={l.id}
              onClick={() => setActiveId(l.id)}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 ${
                activeId === l.id ? "bg-ink text-paper" : "hover:bg-black/5"
              }`}
            >
              <span className="flex-1 truncate">{l.name}</span>
              <span className={`text-xs ${activeId === l.id ? "text-paper/70" : "text-ink/40"}`}>{open}</span>
            </button>
          );
        })}
        <button onClick={() => setShowNew(true)} className="btn btn-ghost w-full text-sm">+ New list</button>
      </aside>

      <section className="card p-5 min-h-[60vh]">
        {!active ? (
          <div className="text-center text-ink/50 py-12">Pick or create a list.</div>
        ) : (
          <ListView
            list={active}
            items={activeItems}
            onAdd={(text) => startTransition(async () => { await addItemAction(active.id, text); router.refresh(); })}
            onToggle={(id, c) => startTransition(async () => { await toggleItemAction(id, c); router.refresh(); })}
            onDelete={(id) => startTransition(async () => { await deleteItemAction(id); router.refresh(); })}
            onClearCompleted={() => startTransition(async () => { await clearCompletedAction(active.id); router.refresh(); })}
            onRename={(name) => startTransition(async () => { await renameListAction(active.id, name); router.refresh(); })}
            onDeleteList={() => {
              if (confirm(`Delete list "${active.name}"?`)) {
                startTransition(async () => {
                  await deleteListAction(active.id);
                  setActiveId(null);
                  router.refresh();
                });
              }
            }}
          />
        )}
      </section>

      {showNew && (
        <NewListDialog
          onClose={() => setShowNew(false)}
          onCreate={(name, kind) => {
            startTransition(async () => {
              const res = await createListAction({ name, kind });
              if (res?.ok) setActiveId(res.id);
              setShowNew(false);
              router.refresh();
            });
          }}
        />
      )}
    </div>
  );
}

function ListView({
  list, items, onAdd, onToggle, onDelete, onClearCompleted, onRename, onDeleteList,
}: {
  list: List;
  items: ListItem[];
  onAdd: (text: string) => void;
  onToggle: (id: string, c: boolean) => void;
  onDelete: (id: string) => void;
  onClearCompleted: () => void;
  onRename: (name: string) => void;
  onDeleteList: () => void;
}) {
  const [newText, setNewText] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(list.name);
  const open = items.filter((i) => !i.completed_at);
  const done = items.filter((i) => i.completed_at);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {editingName ? (
          <input
            className="input flex-1 text-2xl font-display"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onBlur={() => { setEditingName(false); if (name.trim() && name !== list.name) onRename(name.trim()); }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          />
        ) : (
          <h1 onClick={() => setEditingName(true)} className="font-display text-3xl flex-1 cursor-text">{list.name}</h1>
        )}
        <span className="chip bg-paper text-ink/60 capitalize">{list.kind}</span>
        <button onClick={onDeleteList} className="btn btn-ghost text-ink/40 hover:text-red-600 px-2">×</button>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (newText.trim()) { onAdd(newText); setNewText(""); } }}
        className="flex gap-2"
      >
        <input className="input flex-1" placeholder="Add item…" value={newText} onChange={(e) => setNewText(e.target.value)} />
        <button type="submit" className="btn btn-primary">Add</button>
      </form>

      <ul className="space-y-1">
        {open.map((item) => (
          <li key={item.id} className="flex items-center gap-3 group rounded-lg hover:bg-paper px-2 py-1.5">
            <button
              onClick={() => onToggle(item.id, true)}
              className="w-5 h-5 rounded-md border-2 border-black/20 hover:border-ink"
              aria-label="Complete"
            />
            <span className="flex-1">{item.text}</span>
            <button
              onClick={() => onDelete(item.id)}
              className="opacity-0 group-hover:opacity-100 text-ink/40 hover:text-red-600 px-1"
            >×</button>
          </li>
        ))}
      </ul>

      {done.length > 0 && (
        <div className="pt-3 border-t border-black/5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs uppercase tracking-wide text-ink/50">Done · {done.length}</h3>
            <button onClick={onClearCompleted} className="text-xs text-ink/50 hover:text-ink">Clear all</button>
          </div>
          <ul className="space-y-1">
            {done.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-2 py-1 text-ink/40 line-through">
                <button
                  onClick={() => onToggle(item.id, false)}
                  className="w-5 h-5 rounded-md bg-emerald-500 text-white text-xs flex items-center justify-center"
                  aria-label="Undo"
                >✓</button>
                <span className="flex-1">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function NewListDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, kind: ListKind) => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ListKind>("todo");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="card w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-2xl">New list</h2>
        <div>
          <label className="label">Name</label>
          <input autoFocus className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value as ListKind)}>
            <option value="todo">To-do</option>
            <option value="grocery">Grocery</option>
            <option value="notes">Notes</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn">Cancel</button>
          <button
            onClick={() => name.trim() && onCreate(name.trim(), kind)}
            className="btn btn-primary"
          >Create</button>
        </div>
      </div>
    </div>
  );
}
