import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  fetchEvents, fetchMembers, fetchChores, fetchChoreCompletions,
  fetchMeals, fetchLists, fetchListItems, fetchPhotos, fetchNotes,
} from "@/lib/data";
import { isoDate, plusDays } from "@/lib/dates";
import { WallDisplay } from "@/components/wall/WallDisplay";

export const dynamic = "force-dynamic";

export default async function WallPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/wall");
  const { data: membership } = await supabase
    .from("household_users")
    .select("households(id, name, timezone)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const housePicked = membership?.households as unknown as
    | { id: string; name: string; timezone: string }
    | { id: string; name: string; timezone: string }[]
    | null
    | undefined;
  const household = Array.isArray(housePicked) ? housePicked[0] ?? null : housePicked ?? null;
  if (!household) redirect("/onboarding");

  const today = new Date();
  const rangeStart = plusDays(today, -1);
  const rangeEnd = plusDays(today, 30);
  const fromIso = isoDate(today);
  const toIso = isoDate(plusDays(today, 6));

  const [members, events, chores, completions, meals, lists, photos, notes] = await Promise.all([
    fetchMembers(household.id),
    fetchEvents(household.id, rangeStart, rangeEnd),
    fetchChores(household.id),
    fetchChoreCompletions(household.id, fromIso),
    fetchMeals(household.id, fromIso, toIso),
    fetchLists(household.id),
    fetchPhotos(household.id),
    fetchNotes(household.id),
  ]);

  const listItemsArrays = await Promise.all(lists.map((l) => fetchListItems(l.id)));
  const listItems: Record<string, typeof listItemsArrays[number]> = {};
  lists.forEach((l, i) => { listItems[l.id] = listItemsArrays[i]; });

  const signedPhotos = await Promise.all(
    photos.slice(0, 30).map(async (p) => {
      const { data } = await supabase.storage.from("photos").createSignedUrl(p.storage_path, 60 * 60 * 6);
      return { ...p, signedUrl: data?.signedUrl ?? null };
    }),
  );

  return (
    <WallDisplay
      household={household}
      members={members}
      events={events}
      chores={chores}
      completions={completions}
      meals={meals}
      lists={lists}
      listItems={listItems}
      photos={signedPhotos}
      notes={notes}
    />
  );
}
