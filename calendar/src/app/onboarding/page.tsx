import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { OnboardingForm } from "./form";

export default async function OnboardingPage() {
  const { user, supabase } = await requireUser();
  const { data: memberships } = await supabase
    .from("household_users")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1);
  if (memberships && memberships.length > 0) redirect("/calendar");

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="card w-full max-w-xl p-8">
        <h1 className="font-display text-4xl mb-2">Welcome</h1>
        <p className="text-ink/60 mb-8">Let&apos;s set up your family.</p>
        <OnboardingForm />
      </div>
    </main>
  );
}
