"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import type { AutomationScene, LightDevice, SceneAction } from "@/lib/supabase/types";
import {
  runSceneAction, createSceneAction, updateSceneAction, deleteSceneAction,
} from "@/app/(app)/automations/actions";

export function AutomationsApp({
  scenes, devices, enabled, lightScenes,
}: {
  scenes: AutomationScene[];
  devices: LightDevice[];
  enabled: boolean;
  lightScenes: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<AutomationScene | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);

  function run<T>(fn: () => Promise<T>, runId?: string) {
    setError(null);
    setRunning(runId ?? null);
    startTransition(async () => {
      try { await fn(); router.refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : "failed"); }
      setRunning(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Automations</h1>
          <p className="text-ink/60 text-sm">Tap a scene to run it.</p>
        </div>
        <button onClick={() => setEditing("new")} className="btn btn-primary">+ New scene</button>
      </div>

      {!enabled && (
        <div className="card p-4 bg-cream/60 border-l-4 border-accent text-sm text-ink/70">
          Lights aren&apos;t reachable from this instance — running a scene will be recorded but won&apos;t change any bulbs. Run a copy of this app at home with{" "}
          <code className="bg-paper px-1 rounded">LIGHTS_ENABLED=1</code> for actual control.
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenes.length === 0 && (
          <div className="col-span-full card p-12 text-center text-ink/50">No scenes yet.</div>
        )}
        {scenes.map((s) => (
          <SceneTile
            key={s.id}
            scene={s}
            running={running === s.id && pending}
            onRun={() => run(() => runSceneAction(s.id), s.id)}
            onEdit={() => setEditing(s)}
          />
        ))}
      </div>

      {editing && (
        <SceneDialog
          scene={editing === "new" ? undefined : editing}
          devices={devices}
          lightScenes={lightScenes}
          onClose={() => setEditing(null)}
          onSave={async (payload) => {
            const res = editing === "new"
              ? await createSceneAction(payload)
              : await updateSceneAction(editing.id, payload);
            if (res?.error) { setError(res.error); return; }
            setEditing(null);
            router.refresh();
          }}
          onDelete={editing === "new" ? undefined : async () => {
            if (!confirm(`Delete "${(editing as AutomationScene).name}"?`)) return;
            await deleteSceneAction((editing as AutomationScene).id);
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function SceneTile({
  scene, running, onRun, onEdit,
}: {
  scene: AutomationScene;
  running: boolean;
  onRun: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-lg transition">
      <div className="flex items-start justify-between">
        <div className="text-4xl">{scene.emoji ?? "✨"}</div>
        <button onClick={onEdit} className="text-xs text-ink/40 hover:text-ink">Edit</button>
      </div>
      <div>
        <div className="font-display text-xl">{scene.name}</div>
        {scene.description && <div className="text-sm text-ink/60 mt-1">{scene.description}</div>}
      </div>
      <div className="flex items-center gap-2 mt-auto pt-2">
        <button
          onClick={onRun}
          disabled={running}
          className="btn btn-primary flex-1 disabled:opacity-50"
        >
          {running ? "Running…" : "Run"}
        </button>
        {scene.last_run_at && (
          <span className="text-[11px] text-ink/40">
            ran {formatDistanceToNow(new Date(scene.last_run_at), { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
}

const ACTION_TYPES = [
  { v: "lights.scene",      label: "Set scene" },
  { v: "lights.brightness", label: "Set brightness" },
  { v: "lights.on",         label: "Turn on" },
  { v: "lights.off",        label: "Turn off" },
  { v: "lights.temp",       label: "Set color temp" },
] as const;

function SceneDialog({
  scene, devices, lightScenes, onSave, onDelete, onClose,
}: {
  scene?: AutomationScene;
  devices: LightDevice[];
  lightScenes: string[];
  onSave: (p: { name: string; emoji: string; description: string; actions: SceneAction[] }) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(scene?.name ?? "");
  const [emoji, setEmoji] = useState(scene?.emoji ?? "✨");
  const [description, setDescription] = useState(scene?.description ?? "");
  const [actions, setActions] = useState<SceneAction[]>(scene?.actions ?? [
    { type: "lights.scene", target: "all", scene: "cozy", dimming: 50 },
  ]);

  const targets = [
    { v: "all", label: "All lights" },
    ...devices.map((d) => ({ v: `device:${d.id}`, label: d.name })),
  ];

  function update(i: number, patch: Partial<SceneAction>) {
    setActions((arr) => arr.map((a, j) => (j === i ? ({ ...a, ...patch } as SceneAction) : a)));
  }
  function addAction() {
    setActions((arr) => [...arr, { type: "lights.scene", target: "all", scene: "cozy" }]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 overflow-y-auto py-12" onClick={onClose}>
      <div className="card w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-2xl">{scene ? "Edit scene" : "New scene"}</h2>

        <div className="grid grid-cols-[80px_1fr] gap-3">
          <div>
            <label className="label">Emoji</label>
            <input className="input text-center text-2xl" maxLength={4} value={emoji} onChange={(e) => setEmoji(e.target.value)} />
          </div>
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Actions</label>
            <button onClick={addAction} className="btn btn-ghost text-xs">+ Add action</button>
          </div>
          <div className="space-y-2">
            {actions.map((a, i) => (
              <div key={i} className="rounded-xl border border-black/10 p-3 space-y-2 bg-paper/40">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="input"
                    value={a.type}
                    onChange={(e) => {
                      const t = e.target.value as SceneAction["type"];
                      const base = { target: a.target ?? "all" };
                      if (t === "lights.scene") update(i, { type: t, ...base, scene: "cozy" } as SceneAction);
                      else if (t === "lights.brightness") update(i, { type: t, ...base, dimming: 50 } as SceneAction);
                      else if (t === "lights.on" || t === "lights.off") update(i, { type: t, ...base } as SceneAction);
                      else if (t === "lights.temp") update(i, { type: t, ...base, temp: 3000 } as SceneAction);
                    }}
                  >
                    {ACTION_TYPES.map((opt) => <option key={opt.v} value={opt.v}>{opt.label}</option>)}
                  </select>
                  <select className="input" value={a.target} onChange={(e) => update(i, { target: e.target.value } as Partial<SceneAction>)}>
                    {targets.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
                  </select>
                </div>
                {a.type === "lights.scene" && (
                  <div className="grid grid-cols-2 gap-2">
                    <select className="input" value={a.scene} onChange={(e) => update(i, { scene: e.target.value } as Partial<SceneAction>)}>
                      {lightScenes.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input
                      className="input" type="number" min={10} max={100}
                      placeholder="Dim 10–100"
                      value={a.dimming ?? ""}
                      onChange={(e) => update(i, { dimming: e.target.value ? parseInt(e.target.value, 10) : undefined } as Partial<SceneAction>)}
                    />
                  </div>
                )}
                {a.type === "lights.brightness" && (
                  <input
                    className="input" type="number" min={10} max={100}
                    value={a.dimming}
                    onChange={(e) => update(i, { dimming: parseInt(e.target.value || "10", 10) } as Partial<SceneAction>)}
                  />
                )}
                {a.type === "lights.temp" && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="input" type="number" min={2200} max={6500}
                      value={a.temp}
                      onChange={(e) => update(i, { temp: parseInt(e.target.value || "3000", 10) } as Partial<SceneAction>)}
                    />
                    <input
                      className="input" type="number" min={10} max={100}
                      placeholder="Dim 10–100"
                      value={a.dimming ?? ""}
                      onChange={(e) => update(i, { dimming: e.target.value ? parseInt(e.target.value, 10) : undefined } as Partial<SceneAction>)}
                    />
                  </div>
                )}
                <div className="flex justify-end">
                  <button onClick={() => setActions((arr) => arr.filter((_, j) => j !== i))} className="btn btn-ghost text-xs text-ink/40 hover:text-red-600">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-2">
          {onDelete ? <button onClick={onDelete} className="btn text-red-600 border-red-200 hover:bg-red-50">Delete</button> : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn">Cancel</button>
            <button onClick={() => onSave({ name, emoji, description, actions })} className="btn btn-primary">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
