"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LightDevice } from "@/lib/supabase/types";
import {
  discoverLightsAction, setDeviceStateAction, updateDeviceAction, deleteDeviceAction,
} from "@/app/(app)/lights/actions";

export function LightsApp({
  devices, enabled, scenes,
}: {
  devices: LightDevice[];
  enabled: boolean;
  scenes: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<LightDevice | null>(null);

  function run<T>(fn: () => Promise<T>) {
    setError(null);
    startTransition(async () => {
      try { await fn(); router.refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : "failed"); }
    });
  }

  const rooms = new Map<string, LightDevice[]>();
  for (const d of devices) {
    const key = d.room || "Unassigned";
    if (!rooms.has(key)) rooms.set(key, []);
    rooms.get(key)!.push(d);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Lights</h1>
          <p className="text-ink/60 text-sm">Wiz LEDs over UDP. Local-only.</p>
        </div>
        <div className="flex gap-2">
          {enabled && (
            <button
              onClick={() => run(() => discoverLightsAction())}
              disabled={pending}
              className="btn"
            >{pending ? "Searching…" : "Discover"}</button>
          )}
        </div>
      </div>

      {!enabled && (
        <div className="card p-4 bg-cream/60 border-l-4 border-accent">
          <div className="font-medium">Control unavailable on this instance.</div>
          <div className="text-ink/60 text-sm mt-1">
            Wiz LEDs are LAN-only. To control them, run a second copy of this app at home with{" "}
            <code className="bg-paper px-1 rounded">LIGHTS_ENABLED=1</code> and{" "}
            <code className="bg-paper px-1 rounded">WIZ_BROADCAST=…</code> set. Devices and scenes still sync between instances via Supabase.
          </div>
        </div>
      )}

      {/* All-lights master controls */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-display text-xl">All lights</div>
            <div className="text-ink/50 text-sm">{devices.length} device{devices.length === 1 ? "" : "s"}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button disabled={!enabled || pending} onClick={() => run(() => setDeviceStateAction({ scope: "all", state: true  }))} className="btn disabled:opacity-40">On</button>
            <button disabled={!enabled || pending} onClick={() => run(() => setDeviceStateAction({ scope: "all", state: false }))} className="btn disabled:opacity-40">Off</button>
            <select
              disabled={!enabled || pending}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) run(() => setDeviceStateAction({ scope: "all", scene: e.target.value }));
                e.target.value = "";
              }}
              className="input w-44 disabled:opacity-40"
            >
              <option value="">Set scene…</option>
              {scenes.map((s) => <option key={s} value={s}>{prettyScene(s)}</option>)}
            </select>
            <BrightnessSlider
              disabled={!enabled || pending}
              onCommit={(v) => run(() => setDeviceStateAction({ scope: "all", dimming: v }))}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {devices.length === 0 ? (
        <div className="card p-12 text-center text-ink/50">
          {enabled ? "No devices yet — click Discover." : "No devices saved yet."}
        </div>
      ) : (
        <div className="space-y-5">
          {[...rooms.entries()].map(([room, list]) => (
            <div key={room}>
              <h2 className="text-xs uppercase tracking-wide text-ink/50 mb-2">{room}</h2>
              <div className="space-y-2">
                {list.map((d) => (
                  <DeviceRow
                    key={d.id}
                    device={d}
                    enabled={enabled}
                    pending={pending}
                    scenes={scenes}
                    onEdit={() => setEditing(d)}
                    onAction={(payload) => run(() => setDeviceStateAction({ scope: "device", device_id: d.id, ...payload }))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <DeviceDialog
          device={editing}
          onClose={() => setEditing(null)}
          onSave={async (name, room) => {
            await updateDeviceAction({ id: editing.id, name, room: room || null });
            setEditing(null);
            router.refresh();
          }}
          onDelete={async () => {
            if (!confirm(`Remove "${editing.name}"?`)) return;
            await deleteDeviceAction(editing.id);
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function DeviceRow({
  device, enabled, pending, scenes, onEdit, onAction,
}: {
  device: LightDevice;
  enabled: boolean;
  pending: boolean;
  scenes: string[];
  onEdit: () => void;
  onAction: (p: { state?: boolean; dimming?: number; scene?: string }) => void;
}) {
  return (
    <div className="card p-3 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
        <button onClick={onEdit} className="text-left hover:underline">
          <div className="font-medium">{device.name}</div>
          <div className="text-xs text-ink/40">{device.ip}</div>
        </button>
      </div>
      <button disabled={!enabled || pending} onClick={() => onAction({ state: true  })} className="btn disabled:opacity-40">On</button>
      <button disabled={!enabled || pending} onClick={() => onAction({ state: false })} className="btn disabled:opacity-40">Off</button>
      <select
        disabled={!enabled || pending}
        defaultValue=""
        onChange={(e) => { if (e.target.value) onAction({ scene: e.target.value }); e.target.value = ""; }}
        className="input w-40 disabled:opacity-40"
      >
        <option value="">Scene…</option>
        {scenes.map((s) => <option key={s} value={s}>{prettyScene(s)}</option>)}
      </select>
      <BrightnessSlider disabled={!enabled || pending} onCommit={(v) => onAction({ dimming: v })} />
    </div>
  );
}

function BrightnessSlider({ disabled, onCommit }: { disabled: boolean; onCommit: (v: number) => void }) {
  const [val, setVal] = useState(60);
  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <input
        type="range" min={10} max={100} value={val}
        disabled={disabled}
        onChange={(e) => setVal(parseInt(e.target.value, 10))}
        onMouseUp={() => onCommit(val)}
        onTouchEnd={() => onCommit(val)}
        className="flex-1 disabled:opacity-40"
      />
      <span className="w-8 text-xs text-ink/60 tabular-nums text-right">{val}</span>
    </div>
  );
}

function DeviceDialog({
  device, onSave, onDelete, onClose,
}: {
  device: LightDevice;
  onSave: (name: string, room: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(device.name);
  const [room, setRoom] = useState(device.room ?? "");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-2xl">Edit device</h2>
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Room</label>
          <input className="input" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Living room, Kitchen, …" />
        </div>
        <div className="text-xs text-ink/40">IP {device.ip}{device.mac ? ` · MAC ${device.mac}` : ""}</div>
        <div className="flex justify-between pt-2">
          <button onClick={onDelete} className="btn text-red-600 border-red-200 hover:bg-red-50">Remove</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn">Cancel</button>
            <button onClick={() => onSave(name, room)} className="btn btn-primary">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function prettyScene(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
