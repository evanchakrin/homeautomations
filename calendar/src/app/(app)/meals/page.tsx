import { requireHousehold } from "@/lib/auth";
import { fetchMeals } from "@/lib/data";
import { isoDate, plusDays } from "@/lib/dates";
import { MealsApp } from "@/components/meals/MealsApp";

export const dynamic = "force-dynamic";

export default async function MealsPage() {
  const { household } = await requireHousehold();
  const start = new Date();
  const from = isoDate(start);
  const to = isoDate(plusDays(start, 13));
  const meals = await fetchMeals(household.id, from, to);
  return <MealsApp from={from} meals={meals} rangeTo={to} />;
}
