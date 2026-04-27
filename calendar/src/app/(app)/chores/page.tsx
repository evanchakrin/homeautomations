import { requireHousehold } from "@/lib/auth";
import { fetchChores, fetchChoreCompletions, fetchMembers } from "@/lib/data";
import { ChoresApp } from "@/components/chores/ChoresApp";
import { isoDate, plusDays } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function ChoresPage() {
  const { household } = await requireHousehold();
  const fromDate = isoDate(plusDays(new Date(), -30));
  const [members, chores, completions] = await Promise.all([
    fetchMembers(household.id),
    fetchChores(household.id),
    fetchChoreCompletions(household.id, fromDate),
  ]);
  return <ChoresApp members={members} chores={chores} completions={completions} />;
}
