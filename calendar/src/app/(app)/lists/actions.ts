"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function ctx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data } = await supabase
    .from("household_users").select("household_id").eq("user_id", user.id).limit(1).single();
  if (!data) throw new Error("No household");
  return { supabase, household_id: data.household_id as string };
}

export async function createListAction(input: { name: string; kind: "todo"|"grocery"|"notes" }) {
  const { supabase, household_id } = await ctx();
  const name = input.name.trim();
  if (!name) return { error: "Name required" };
  const { data: maxRow } = await supabase
    .from("lists").select("position").eq("household_id", household_id).order("position", { ascending: false }).limit(1);
  const position = (maxRow?.[0]?.position ?? -1) + 1;
  const { data, error } = await supabase.from("lists")
    .insert({ household_id, name, kind: input.kind, position })
    .select("id").single();
  if (error || !data) return { error: error?.message || "Insert failed" };
  revalidatePath("/lists");
  return { ok: true, id: data.id as string };
}

export async function renameListAction(id: string, name: string) {
  const { supabase } = await ctx();
  if (!name.trim()) return { error: "Name required" };
  const { error } = await supabase.from("lists").update({ name: name.trim() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/lists");
  return { ok: true };
}

export async function deleteListAction(id: string) {
  const { supabase } = await ctx();
  const { error } = await supabase.from("lists").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/lists");
  return { ok: true };
}

export async function addItemAction(listId: string, text: string) {
  const { supabase } = await ctx();
  if (!text.trim()) return { ok: true };
  const { data: maxRow } = await supabase
    .from("list_items").select("position").eq("list_id", listId).order("position", { ascending: false }).limit(1);
  const position = (maxRow?.[0]?.position ?? -1) + 1;
  const { error } = await supabase.from("list_items").insert({
    list_id: listId, text: text.trim(), position,
  });
  if (error) return { error: error.message };
  revalidatePath("/lists");
  revalidatePath("/wall");
  return { ok: true };
}

export async function toggleItemAction(itemId: string, complete: boolean) {
  const { supabase } = await ctx();
  const { error } = await supabase.from("list_items")
    .update({ completed_at: complete ? new Date().toISOString() : null })
    .eq("id", itemId);
  if (error) return { error: error.message };
  revalidatePath("/lists");
  revalidatePath("/wall");
  return { ok: true };
}

export async function deleteItemAction(itemId: string) {
  const { supabase } = await ctx();
  const { error } = await supabase.from("list_items").delete().eq("id", itemId);
  if (error) return { error: error.message };
  revalidatePath("/lists");
  return { ok: true };
}

export async function clearCompletedAction(listId: string) {
  const { supabase } = await ctx();
  const { error } = await supabase.from("list_items")
    .delete().eq("list_id", listId).not("completed_at", "is", null);
  if (error) return { error: error.message };
  revalidatePath("/lists");
  return { ok: true };
}
