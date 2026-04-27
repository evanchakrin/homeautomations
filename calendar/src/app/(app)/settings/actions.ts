"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function ctx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data } = await supabase
    .from("household_users").select("household_id, role").eq("user_id", user.id).limit(1).single();
  if (!data) throw new Error("No household");
  return { supabase, user, household_id: data.household_id as string, role: data.role as string };
}

const HouseholdSchema = z.object({
  name: z.string().min(1).max(60),
  timezone: z.string().min(1).max(60),
});

export async function updateHouseholdAction(input: unknown) {
  const parsed = HouseholdSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };
  const { supabase, household_id } = await ctx();
  const { error } = await supabase.from("households").update(parsed.data).eq("id", household_id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

const MemberSchema = z.object({
  name: z.string().min(1).max(40),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  emoji: z.string().max(4).optional(),
});

export async function addMemberAction(input: unknown) {
  const parsed = MemberSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };
  const { supabase, household_id } = await ctx();
  const { data: maxRow } = await supabase
    .from("family_members").select("position").eq("household_id", household_id).order("position", { ascending: false }).limit(1);
  const position = (maxRow?.[0]?.position ?? -1) + 1;
  const { error } = await supabase.from("family_members").insert({
    household_id,
    name: parsed.data.name,
    color: parsed.data.color,
    emoji: parsed.data.emoji || null,
    position,
  });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateMemberAction(id: string, input: unknown) {
  const parsed = MemberSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };
  const { supabase } = await ctx();
  const { error } = await supabase.from("family_members").update({
    name: parsed.data.name,
    color: parsed.data.color,
    emoji: parsed.data.emoji || null,
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteMemberAction(id: string) {
  const { supabase } = await ctx();
  const { error } = await supabase.from("family_members").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function resetPointsAction(id: string) {
  const { supabase } = await ctx();
  const { error } = await supabase.from("family_members").update({ points: 0 }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/chores");
  return { ok: true };
}

