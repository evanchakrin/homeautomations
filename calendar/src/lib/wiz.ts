// TS port of wiz/control.py + wiz/discover.py for use from Next.js server actions.
// Only functional when LIGHTS_ENABLED=1 and the Node process can reach the LAN.

import dgram from "node:dgram";

export const WIZ_SCENES: Record<string, number> = {
  cozy: 6,
  warm_white: 12,
  focus: 14,
  bedtime: 18,
  daylight: 11,
  cool_white: 13,
  night_light: 29,
  candlelight: 30,
  golden_white: 31,
  pulse: 32,
  steampunk: 33,
};

const PORT = Number(process.env.WIZ_PORT ?? 38899);
const DEFAULT_BROADCAST = process.env.WIZ_BROADCAST ?? "192.168.39.255";

export function lightsEnabled(): boolean {
  return process.env.LIGHTS_ENABLED === "1";
}

export type DiscoveredDevice = {
  ip: string;
  mac?: string;
  state?: boolean;
  sceneId?: number;
  dimming?: number;
};

function send(ip: string, method: string, params: Record<string, unknown>, timeoutMs = 1500) {
  return new Promise<{ ok: boolean; result?: unknown; error?: string }>((resolve) => {
    const socket = dgram.createSocket("udp4");
    let settled = false;
    const finish = (res: { ok: boolean; result?: unknown; error?: string }) => {
      if (settled) return;
      settled = true;
      try { socket.close(); } catch {}
      resolve(res);
    };

    socket.on("message", (msg) => {
      try {
        const parsed = JSON.parse(msg.toString());
        if (parsed.error) finish({ ok: false, error: String(parsed.error.message ?? parsed.error) });
        else finish({ ok: !!parsed.result?.success || true, result: parsed.result });
      } catch {
        finish({ ok: false, error: "bad-response" });
      }
    });
    socket.on("error", (e) => finish({ ok: false, error: e.message }));

    const payload = Buffer.from(JSON.stringify({ method, params }));
    socket.send(payload, PORT, ip, (err) => {
      if (err) finish({ ok: false, error: err.message });
    });

    setTimeout(() => finish({ ok: false, error: "timeout" }), timeoutMs);
  });
}

export async function discover(
  broadcast = DEFAULT_BROADCAST,
  timeoutMs = 2000,
): Promise<DiscoveredDevice[]> {
  if (!lightsEnabled()) return [];
  return new Promise<DiscoveredDevice[]>((resolve) => {
    const socket = dgram.createSocket("udp4");
    const seen = new Map<string, DiscoveredDevice>();

    socket.on("message", (msg, rinfo) => {
      try {
        const parsed = JSON.parse(msg.toString());
        const r = parsed.result ?? {};
        seen.set(rinfo.address, {
          ip: rinfo.address,
          mac: r.mac,
          state: r.state,
          sceneId: r.sceneId,
          dimming: r.dimming,
        });
      } catch {}
    });

    socket.bind(0, () => {
      try { socket.setBroadcast(true); } catch {}
      const payload = Buffer.from(JSON.stringify({ method: "getPilot", params: {} }));
      socket.send(payload, PORT, broadcast);
    });

    setTimeout(() => {
      try { socket.close(); } catch {}
      resolve([...seen.values()]);
    }, timeoutMs);
  });
}

export async function setPilot(ip: string, params: Record<string, unknown>) {
  if (!lightsEnabled()) return { ok: false, error: "control_disabled" } as const;
  return send(ip, "setPilot", params);
}

export async function setSceneOn(ip: string, scene: string | number, dimming?: number) {
  const sceneId = typeof scene === "string" ? WIZ_SCENES[scene] ?? 6 : scene;
  const params: Record<string, unknown> = { sceneId, state: true };
  if (typeof dimming === "number") params.dimming = clamp(dimming, 10, 100);
  return setPilot(ip, params);
}

export async function setBrightness(ip: string, dimming: number) {
  return setPilot(ip, { state: true, dimming: clamp(dimming, 10, 100) });
}

export async function turnOn(ip: string)  { return setPilot(ip, { state: true  }); }
export async function turnOff(ip: string) { return setPilot(ip, { state: false }); }

export async function setTemp(ip: string, temp: number, dimming?: number) {
  const params: Record<string, unknown> = { temp: clamp(temp, 2200, 6500), state: true };
  if (typeof dimming === "number") params.dimming = clamp(dimming, 10, 100);
  return setPilot(ip, params);
}

export async function setColor(ip: string, r: number, g: number, b: number, dimming = 100) {
  return setPilot(ip, {
    r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255),
    dimming: clamp(dimming, 10, 100), state: true,
  });
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
