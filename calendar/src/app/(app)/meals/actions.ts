"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meal_type: z.enum(["breakfast","lunch","dinner","snack"]),
  title: z.string().max(200),
  notes: z.string().max(500).nullable().optional(),
});

async function ctx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data } = await supabase
    .from("household_users").select("household_id").eq("user_id", user.id).limit(1).single();
  if (!data) throw new Error("No household");
  return { supabase, household_id: data.household_id as string };
}

export async function setMealAction(input: unknown) {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { error: "Invalid meal" };
  const { supabase, household_id } = await ctx();

  if (!parsed.data.title.trim()) {
    const { error } = await supabase
      .from("meals")
      .delete()
      .eq("household_id", household_id)
      .eq("date", parsed.data.date)
      .eq("meal_type", parsed.data.meal_type);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("meals").upsert(
      {
        household_id,
        date: parsed.data.date,
        meal_type: parsed.data.meal_type,
        title: parsed.data.title.trim(),
        notes: parsed.data.notes || null,
      },
      { onConflict: "household_id,date,meal_type" },
    );
    if (error) return { error: error.message };
  }
  revalidatePath("/meals");
  revalidatePath("/wall");
  return { ok: true };
}
