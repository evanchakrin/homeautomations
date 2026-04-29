import { createClient } from "@/lib/supabase/server";
import type {
  EventWithAssignees, FamilyMember, Chore, ChoreCompletion,
  Meal, List, ListItem, Photo, LightDevice, AutomationScene, Note,
} from "@/lib/supabase/types";

export async function fetchMembers(householdId: string): Promise<FamilyMember[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("family_members")
    .select("*")
    .eq("household_id", householdId)
    .order("position");
  return data ?? [];
}

export async function fetchEvents(
  householdId: string,
  _rangeStart: Date,
  _rangeEnd: Date,
): Promise<EventWithAssignees[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select("*, event_assignees(member_id)")
    .eq("household_id", householdId)
    .order("starts_at");
  type Row = EventWithAssignees & { event_assignees: { member_id: string }[] };
  return (data ?? []).map((row: unknown) => {
    const r = row as Row;
    return { ...r, member_ids: r.event_assignees?.map((a) => a.member_id) ?? [] };
  });
}

export async function fetchChores(householdId: string): Promise<Chore[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("chores")
    .select("*")
    .eq("household_id", householdId)
    .order("due_date", { ascending: true, nullsFirst: false });
  return data ?? [];
}

export async function fetchChoreCompletions(
  householdId: string,
  fromDate: string,
): Promise<ChoreCompletion[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("chore_completions")
    .select("*, chores!inner(household_id)")
    .eq("chores.household_id", householdId)
    .gte("completed_on", fromDate);
  return (data ?? []) as unknown as ChoreCompletion[];
}

export async function fetchMeals(householdId: string, fromDate: string, toDate: string): Promise<Meal[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("meals")
    .select("*")
    .eq("household_id", householdId)
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date");
  return data ?? [];
}

export async function fetchLists(householdId: string): Promise<List[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("lists")
    .select("*")
    .eq("household_id", householdId)
    .order("position");
  return data ?? [];
}

export async function fetchListItems(listId: string): Promise<ListItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("list_items")
    .select("*")
    .eq("list_id", listId)
    .order("completed_at", { ascending: true, nullsFirst: true })
    .order("position");
  return data ?? [];
}

export async function fetchPhotos(householdId: string): Promise<Photo[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("photos")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function fetchLightDevices(householdId: string): Promise<LightDevice[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("light_devices")
    .select("*")
    .eq("household_id", householdId)
    .order("position");
  return data ?? [];
}

export async function fetchScenes(householdId: string): Promise<AutomationScene[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("automation_scenes")
    .select("*")
    .eq("household_id", householdId)
    .order("position");
  return (data ?? []) as AutomationScene[];
}

export async function fetchNotes(householdId: string): Promise<Note[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("notes")
    .select("*")
    .eq("household_id", householdId)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  return data ?? [];
}
