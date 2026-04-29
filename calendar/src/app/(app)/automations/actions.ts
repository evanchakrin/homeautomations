"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { SceneAction } from "@/lib/supabase/types";
import {
  lightsEnabled, setSceneOn, setBrightness, turnOn, turnOff, setTemp,
} from "@/lib/wiz";

async function ctx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data } = await supabase
    .from("household_users").select("household_id").eq("user_id", user.id).limit(1).single();
  if (!data) throw new Error("No household");
  return { supabase, household_id: data.household_id as string };
}

const ActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("lights.scene"),      target: z.string(), scene: z.string(), dimming: z.number().int().min(10).max(100).optional() }),
  z.object({ type: z.literal("lights.brightness"), target: z.string(), dimming: z.number().int().min(10).max(100) }),
  z.object({ type: z.literal("lights.on"),         target: z.string() }),
  z.object({ type: z.literal("lights.off"),        target: z.string() }),
  z.object({ type: z.literal("lights.temp"),       target: z.string(), temp: z.number().int().min(2200).max(6500), dimming: z.number().int().min(10).max(100).optional() }),
]);

const SceneSchema = z.object({
  name: z.string().min(1).max(60),
  emoji: z.string().max(4).nullable().optional(),
  description: z.string().max(200).nullable().optional(),
  actions: z.array(ActionSchema),
});

export async function createSceneAction(input: unknown) {
  const parsed = SceneSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid scene" };
  const { supabase, household_id } = await ctx();
  const { data: maxRow } = await supabase
    .from("automation_scenes").select("position").eq("household_id", household_id).order("position", { ascending: false }).limit(1);
  const position = (maxRow?.[0]?.position ?? -1) + 1;
  const { error } = await supabase.from("automation_scenes").insert({
    ...parsed.data, household_id, position,
    emoji: parsed.data.emoji ?? null,
    description: parsed.data.description ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/automations");
  return { ok: true };
}

export async function updateSceneAction(id: string, input: unknown) {
  const parsed = SceneSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid scene" };
  const { supabase } = await ctx();
  const { error } = await supabase.from("automation_scenes")
    .update({
      ...parsed.data,
      emoji: parsed.data.emoji ?? null,
      description: parsed.data.description ?? null,
    }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/automations");
  return { ok: true };
}

export async function deleteSceneAction(id: string) {
  const { supabase } = await ctx();
  const { error } = await supabase.from("automation_scenes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/automations");
  return { ok: true };
}

export async function runSceneAction(sceneId: string) {
  const { supabase, household_id } = await ctx();
  const { data: scene, error: sErr } = await supabase
    .from("automation_scenes").select("*").eq("id", sceneId).eq("household_id", household_id).single();
  if (sErr || !scene) return { error: sErr?.message || "Scene not found" };

  const enabled = lightsEnabled();
  if (!enabled) {
    await supabase.from("automation_scenes").update({ last_run_at: new Date().toISOString() }).eq("id", sceneId);
    revalidatePath("/automations");
    return { ok: true, simulated: true };
  }

  const { data: devices } = await supabase
    .from("light_devices").select("id, ip").eq("household_id", household_id);
  const ipsAll = (devices ?? []).map((d) => d.ip as string);
  const ipById = new Map((devices ?? []).map((d) => [d.id as string, d.ip as string]));

  const actions = (scene.actions ?? []) as SceneAction[];
  let ok = 0, fail = 0;
  for (const a of actions) {
    const targets = a.target === "all"
      ? ipsAll
      : a.target.startsWith("device:") ? [ipById.get(a.target.slice(7)) ?? ""].filter(Boolean) as string[] : [];
    for (const ip of targets) {
      let res;
      switch (a.type) {
        case "lights.scene":      res = await setSceneOn(ip, a.scene, a.dimming); break;
        case "lights.brightness": res = await setBrightness(ip, a.dimming); break;
        case "lights.on":         res = await turnOn(ip); break;
        case "lights.off":        res = await turnOff(ip); break;
        case "lights.temp":       res = await setTemp(ip, a.temp, a.dimming); break;
      }
      if (res?.ok) ok++; else fail++;
    }
  }
  await supabase.from("automation_scenes").update({ last_run_at: new Date().toISOString() }).eq("id", sceneId);
  revalidatePath("/automations");
  return { ok: true, succeeded: ok, failed: fail };
}
