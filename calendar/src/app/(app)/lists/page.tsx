import { requireHousehold } from "@/lib/auth";
import { fetchLists, fetchListItems } from "@/lib/data";
import { ListsApp } from "@/components/lists/ListsApp";

export const dynamic = "force-dynamic";

export default async function ListsPage() {
  const { household } = await requireHousehold();
  const lists = await fetchLists(household.id);
  const items = await Promise.all(lists.map((l) => fetchListItems(l.id)));
  return <ListsApp lists={lists} items={Object.fromEntries(lists.map((l, i) => [l.id, items[i]]))} />;
}
