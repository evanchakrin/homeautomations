import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/auth";

export default async function Home() {
  const ctx = await getCurrentHousehold();
  if (!ctx.household) redirect("/onboarding");
  redirect("/calendar");
}
