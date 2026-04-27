"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(60),
  timezone: z.string().min(1).max(60),
  members: z
    .array(z.object({
      name: z.string().min(1).max(40),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      emoji: z.string().max(4).optional(),
    }))
    .min(1)
    .max(20),
});

export async function createHouseholdAction(input: z.infer<typeof Schema>) {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: hh, error: hhErr } = await supabase
    .from("households")
    .insert({ name: parsed.data.name, timezone: parsed.data.timezone, created_by: user.id })
    .select("id")
    .single();
  if (hhErr || !hh) return { error: hhErr?.message || "Could not create household" };

  const rows = parsed.data.members.map((m, i) => ({
    household_id: hh.id,
    name: m.name,
    color: m.color,
    emoji: m.emoji || null,
    user_id: i === 0 ? user.id : null,
    position: i,
  }));
  const { error: mErr } = await supabase.from("family_members").insert(rows);
  if (mErr) return { error: mErr.message };

  return { ok: true, household_id: hh.id };
}
