import { requireHousehold } from "@/lib/auth";
import { fetchMembers, fetchNotes } from "@/lib/data";
import { NotesApp } from "@/components/notes/NotesApp";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const { household } = await requireHousehold();
  const [members, notes] = await Promise.all([
    fetchMembers(household.id),
    fetchNotes(household.id),
  ]);
  return <NotesApp householdId={household.id} members={members} notes={notes} />;
}
