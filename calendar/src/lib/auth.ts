import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { user, supabase };
}

export async function getCurrentHousehold() {
  const { user, supabase } = await requireUser();
  const { data: memberships } = await supabase
    .from("household_users")
    .select("household_id, role, households(id, name, timezone, created_by, created_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!memberships || memberships.length === 0) return { user, supabase, household: null };

  const first = memberships[0] as unknown as {
    household_id: string;
    role: "owner" | "member";
    households: { id: string; name: string; timezone: string; created_by: string | null; created_at: string };
  };
  return { user, supabase, household: first.households, role: first.role };
}

export async function requireHousehold() {
  const ctx = await getCurrentHousehold();
  if (!ctx.household) redirect("/onboarding");
  return ctx as Required<typeof ctx>;
}
