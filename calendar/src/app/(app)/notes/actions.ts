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

  const { data: me } = await supabase
    .from("family_members")
    .select("id, color")
    .eq("household_id", data.household_id)
    .eq("user_id", user.id)
    .maybeSingle();
  return { supabase, household_id: data.household_id as string, member: me ?? null };
}

const NoteSchema = z.object({
  body: z.string().min(1).max(2000),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  pinned: z.boolean().optional(),
  author_member_id: z.string().uuid().nullable().optional(),
});

export async function createNoteAction(input: unknown) {
  const parsed = NoteSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid note" };
  const { supabase, household_id, member } = await ctx();
  const { error } = await supabase.from("notes").insert({
    household_id,
    body: parsed.data.body.trim(),
    color: parsed.data.color ?? member?.color ?? null,
    pinned: parsed.data.pinned ?? false,
    author_member_id: parsed.data.author_member_id ?? member?.id ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/notes");
  revalidatePath("/wall");
  return { ok: true };
}

export async function updateNoteAction(id: string, input: { body?: string; color?: string | null; pinned?: boolean }) {
  const { supabase } = await ctx();
  const update: Record<string, unknown> = {};
  if (typeof input.body === "string") update.body = input.body.trim();
  if (input.color !== undefined) update.color = input.color;
  if (typeof input.pinned === "boolean") update.pinned = input.pinned;
  const { error } = await supabase.from("notes").update(update).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/notes");
  revalidatePath("/wall");
  return { ok: true };
}

export async function deleteNoteAction(id: string) {
  const { supabase } = await ctx();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/notes");
  revalidatePath("/wall");
  return { ok: true };
}
