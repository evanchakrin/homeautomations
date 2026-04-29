"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { discover, lightsEnabled, setPilot, turnOff, turnOn, setBrightness, setSceneOn, WIZ_SCENES } from "@/lib/wiz";

async function ctx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data } = await supabase
    .from("household_users").select("household_id").eq("user_id", user.id).limit(1).single();
  if (!data) throw new Error("No household");
  return { supabase, household_id: data.household_id as string };
}

export async function discoverLightsAction() {
  if (!lightsEnabled()) return { error: "control_disabled" };
  const { supabase, household_id } = await ctx();
  const found = await discover();
  if (found.length === 0) return { ok: true, count: 0 };

  const rows = found.map((d, i) => ({
    household_id,
    ip: d.ip,
    mac: d.mac ?? null,
    last_seen: new Date().toISOString(),
    name: `Light ${d.ip.split(".").pop()}`,
    position: i,
  }));
  const { error } = await supabase
    .from("light_devices")
    .upsert(rows, { onConflict: "household_id,ip", ignoreDuplicates: false });
  if (error) return { error: error.message };
  revalidatePath("/lights");
  return { ok: true, count: found.length };
}

const TargetCommand = z.object({
  device_id: z.string().uuid().optional(),
  scope: z.enum(["all", "device"]).default("device"),
});

export async function setDeviceStateAction(input: z.infer<typeof TargetCommand> & {
  state?: boolean; dimming?: number; scene?: string;
}) {
  if (!lightsEnabled()) return { error: "control_disabled" };
  const { supabase, household_id } = await ctx();

  const ips: string[] = [];
  if (input.scope === "all") {
    const { data } = await supabase
      .from("light_devices").select("ip").eq("household_id", household_id);
    ips.push(...(data ?? []).map((d) => d.ip as string));
  } else if (input.device_id) {
    const { data } = await supabase
      .from("light_devices").select("ip").eq("id", input.device_id).eq("household_id", household_id).maybeSingle();
    if (data?.ip) ips.push(data.ip as string);
  }

  let ok = 0, fail = 0;
  await Promise.all(ips.map(async (ip) => {
    let res;
    if (input.scene) res = await setSceneOn(ip, input.scene, input.dimming);
    else if (typeof input.dimming === "number") res = await setBrightness(ip, input.dimming);
    else if (input.state === true)  res = await turnOn(ip);
    else if (input.state === false) res = await turnOff(ip);
    else res = await setPilot(ip, {});
    if (res.ok) ok++; else fail++;
  }));

  revalidatePath("/lights");
  return { ok: true, succeeded: ok, failed: fail };
}

const RenameSchema = z.object({ id: z.string().uuid(), name: z.string().min(1).max(60), room: z.string().max(40).nullable().optional() });

export async function updateDeviceAction(input: unknown) {
  const parsed = RenameSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };
  const { supabase } = await ctx();
  const { error } = await supabase.from("light_devices")
    .update({ name: parsed.data.name, room: parsed.data.room ?? null })
    .eq("id", parsed.data.id);
  if (error) return { error: error.message };
  revalidatePath("/lights");
  return { ok: true };
}

export async function deleteDeviceAction(id: string) {
  const { supabase } = await ctx();
  const { error } = await supabase.from("light_devices").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/lights");
  return { ok: true };
}

export const ALL_SCENES = Object.keys(WIZ_SCENES);
