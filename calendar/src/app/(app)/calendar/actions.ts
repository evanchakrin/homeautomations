"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const EventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  starts_at: z.string(),
  ends_at: z.string(),
  all_day: z.boolean().default(false),
  rrule: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  member_ids: z.array(z.string().uuid()),
});

async function authedHouseholdId() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data } = await supabase
    .from("household_users")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (!data) throw new Error("No household");
  return { supabase, user, household_id: data.household_id as string };
}

export async function createEventAction(input: unknown) {
  const parsed = EventSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid event" };
  const { supabase, user, household_id } = await authedHouseholdId();
  const { member_ids, ...row } = parsed.data;
  const { data: ev, error } = await supabase
    .from("events")
    .insert({ ...row, household_id, created_by: user.id })
    .select("id")
    .single();
  if (error || !ev) return { error: error?.message || "Insert failed" };
  if (member_ids.length > 0) {
    await supabase.from("event_assignees").insert(
      member_ids.map((m) => ({ event_id: ev.id, member_id: m })),
    );
  }
  revalidatePath("/calendar");
  revalidatePath("/wall");
  return { ok: true, id: ev.id };
}

export async function updateEventAction(id: string, input: unknown) {
  const parsed = EventSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid event" };
  const { supabase } = await authedHouseholdId();
  const { member_ids, ...row } = parsed.data;
  const { error } = await supabase.from("events").update(row).eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("event_assignees").delete().eq("event_id", id);
  if (member_ids.length > 0) {
    await supabase.from("event_assignees").insert(
      member_ids.map((m) => ({ event_id: id, member_id: m })),
    );
  }
  revalidatePath("/calendar");
  revalidatePath("/wall");
  return { ok: true };
}

export async function deleteEventAction(id: string) {
  const { supabase } = await authedHouseholdId();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/calendar");
  revalidatePath("/wall");
  return { ok: true };
}
