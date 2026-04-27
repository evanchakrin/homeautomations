"use server";

import { revalidatePath } from "next/cache";
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

export async function uploadPhotoAction(formData: FormData) {
  const { supabase, household_id } = await ctx();
  const file = formData.get("file") as File | null;
  const caption = (formData.get("caption") as string | null)?.trim() || null;
  if (!file || file.size === 0) return { error: "No file" };
  if (file.size > 10 * 1024 * 1024) return { error: "Max 10 MB" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${household_id}/${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error: upErr } = await supabase.storage.from("photos").upload(filename, arrayBuffer, {
    contentType: file.type || "image/jpeg",
  });
  if (upErr) return { error: upErr.message };

  const { error: dbErr } = await supabase.from("photos").insert({
    household_id, storage_path: filename, caption,
  });
  if (dbErr) {
    await supabase.storage.from("photos").remove([filename]);
    return { error: dbErr.message };
  }

  revalidatePath("/photos");
  revalidatePath("/wall");
  return { ok: true };
}

export async function deletePhotoAction(id: string, storagePath: string) {
  const { supabase } = await ctx();
  await supabase.storage.from("photos").remove([storagePath]);
  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/photos");
  revalidatePath("/wall");
  return { ok: true };
}
