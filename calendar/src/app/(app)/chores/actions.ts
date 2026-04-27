"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ChoreSchema = z.object({
  title: z.string().min(1).max(120),
  notes: z.string().max(500).nullable().optional(),
  member_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  recurrence: z.enum(["once","daily","weekdays","weekly","monthly"]).default("once"),
  points: z.number().int().min(0).max(1000).default(0),
});

async function ctx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data } = await supabase
    .from("household_users")
    .select("household_id")
    .eq("user_id", user.id).limit(1).single();
  if (!data) throw new Error("No household");
  return { supabase, household_id: data.household_id as string };
}

export async function createChoreAction(input: unknown) {
  const parsed = ChoreSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid chore" };
  const { supabase, household_id } = await ctx();
  const { error } = await supabase.from("chores").insert({
    ...parsed.data,
    member_id: parsed.data.member_id || null,
    due_date: parsed.data.due_date || null,
    notes: parsed.data.notes || null,
    household_id,
  });
  if (error) return { error: error.message };
  revalidatePath("/chores");
  revalidatePath("/wall");
  return { ok: true };
}

export async function updateChoreAction(id: string, input: unknown) {
  const parsed = ChoreSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid chore" };
  const { supabase } = await ctx();
  const { error } = await supabase.from("chores").update({
    ...parsed.data,
    member_id: parsed.data.member_id || null,
    due_date: parsed.data.due_date || null,
    notes: parsed.data.notes || null,
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/chores");
  revalidatePath("/wall");
  return { ok: true };
}

export async function deleteChoreAction(id: string) {
  const { supabase } = await ctx();
  const { error } = await supabase.from("chores").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/chores");
  return { ok: true };
}

export async function toggleChoreAction(choreId: string, completedOn: string, memberId: string | null) {
  const { supabase } = await ctx();
  const { data: existing } = await supabase
    .from("chore_completions")
    .select("id")
    .eq("chore_id", choreId)
    .eq("completed_on", completedOn)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase.from("chore_completions").delete().eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("chore_completions").insert({
      chore_id: choreId, completed_on: completedOn, member_id: memberId,
    });
    if (error) return { error: error.message };
  }
  revalidatePath("/chores");
  revalidatePath("/wall");
  return { ok: true };
}
