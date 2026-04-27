import { requireHousehold } from "@/lib/auth";
import { fetchMembers } from "@/lib/data";
import { SettingsApp } from "@/components/settings/SettingsApp";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { household, role } = await requireHousehold();
  const members = await fetchMembers(household.id);
  return <SettingsApp household={household} members={members} role={role} />;
}
