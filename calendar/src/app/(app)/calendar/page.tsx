import { requireHousehold } from "@/lib/auth";
import { fetchEvents, fetchMembers } from "@/lib/data";
import { CalendarApp } from "@/components/calendar/CalendarApp";
import { plusMonths } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { household } = await requireHousehold();
  const now = new Date();
  const rangeStart = plusMonths(now, -3);
  const rangeEnd = plusMonths(now, 6);
  const [members, events] = await Promise.all([
    fetchMembers(household.id),
    fetchEvents(household.id, rangeStart, rangeEnd),
  ]);
  return <CalendarApp householdId={household.id} members={members} events={events} />;
}
