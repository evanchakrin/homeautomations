import Link from "next/link";
import { requireHousehold } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

const NAV = [
  { href: "/calendar", label: "Calendar" },
  { href: "/chores", label: "Chores" },
  { href: "/meals", label: "Meals" },
  { href: "/lists", label: "Lists" },
  { href: "/photos", label: "Photos" },
  { href: "/settings", label: "Settings" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { household } = await requireHousehold();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-black/5 bg-paper sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center gap-6">
          <Link href="/calendar" className="font-display text-2xl tracking-tight">
            {household.name}
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-1.5 rounded-lg hover:bg-black/5 text-ink/70 hover:text-ink"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/wall" className="btn btn-ghost text-sm">Wall mode</Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-6">{children}</main>
    </div>
  );
}
