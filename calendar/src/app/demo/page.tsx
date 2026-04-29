import Link from "next/link";
import { CalendarApp } from "@/components/calendar/CalendarApp";
import { ChoresApp } from "@/components/chores/ChoresApp";
import { MealsApp } from "@/components/meals/MealsApp";
import { ListsApp } from "@/components/lists/ListsApp";
import { SettingsApp } from "@/components/settings/SettingsApp";
import { WallDisplay } from "@/components/wall/WallDisplay";
import { LightsApp } from "@/components/lights/LightsApp";
import { AutomationsApp } from "@/components/automations/AutomationsApp";
import { NotesApp } from "@/components/notes/NotesApp";
import {
  DEMO_HOUSEHOLD, DEMO_MEMBERS, DEMO_EVENTS, DEMO_CHORES, DEMO_COMPLETIONS,
  DEMO_MEALS, DEMO_LISTS, DEMO_LIST_ITEMS, DEMO_PHOTOS,
  DEMO_DEVICES, DEMO_SCENES, DEMO_NOTES,
} from "@/lib/demo-data";
import { WIZ_SCENES } from "@/lib/wiz";
import { isoDate, plusDays } from "@/lib/dates";

const VIEWS = [
  { v: "calendar",    label: "Calendar" },
  { v: "chores",      label: "Chores" },
  { v: "meals",       label: "Meals" },
  { v: "lists",       label: "Lists" },
  { v: "notes",       label: "Notes" },
  { v: "lights",      label: "Lights" },
  { v: "automations", label: "Automations" },
  { v: "settings",    label: "Settings" },
  { v: "wall",        label: "Wall display" },
] as const;

export default function DemoPage({ searchParams }: { searchParams: { view?: string; chrome?: string } }) {
  const view = (searchParams.view ?? "calendar") as typeof VIEWS[number]["v"];
  const showChrome = searchParams.chrome !== "0";
  const today = new Date();

  let content: React.ReactNode;
  switch (view) {
    case "chores":
      content = (
        <ChoresApp members={DEMO_MEMBERS} chores={DEMO_CHORES} completions={DEMO_COMPLETIONS} />
      );
      break;
    case "meals":
      content = (
        <MealsApp from={isoDate(today)} meals={DEMO_MEALS} rangeTo={isoDate(plusDays(today, 13))} />
      );
      break;
    case "lists":
      content = <ListsApp lists={DEMO_LISTS} items={DEMO_LIST_ITEMS} />;
      break;
    case "settings":
      content = (
        <SettingsApp
          household={{
            id: DEMO_HOUSEHOLD.id,
            name: DEMO_HOUSEHOLD.name,
            timezone: DEMO_HOUSEHOLD.timezone,
            created_by: null,
            created_at: new Date().toISOString(),
          }}
          members={DEMO_MEMBERS}
          role="owner"
        />
      );
      break;
    case "wall":
      return (
        <WallDisplay
          household={DEMO_HOUSEHOLD}
          members={DEMO_MEMBERS}
          events={DEMO_EVENTS}
          chores={DEMO_CHORES}
          completions={DEMO_COMPLETIONS}
          meals={DEMO_MEALS}
          lists={DEMO_LISTS}
          listItems={DEMO_LIST_ITEMS}
          photos={DEMO_PHOTOS}
          notes={DEMO_NOTES}
        />
      );
    case "lights":
      content = (
        <LightsApp devices={DEMO_DEVICES} enabled={false} scenes={Object.keys(WIZ_SCENES)} />
      );
      break;
    case "automations":
      content = (
        <AutomationsApp
          scenes={DEMO_SCENES}
          devices={DEMO_DEVICES}
          enabled={false}
          lightScenes={Object.keys(WIZ_SCENES)}
        />
      );
      break;
    case "notes":
      content = (
        <NotesApp householdId={DEMO_HOUSEHOLD.id} members={DEMO_MEMBERS} notes={DEMO_NOTES} />
      );
      break;
    case "calendar":
    default:
      content = (
        <CalendarApp householdId="demo" members={DEMO_MEMBERS} events={DEMO_EVENTS} />
      );
  }

  if (!showChrome) {
    return <main className="max-w-[1600px] mx-auto w-full px-6 py-6">{content}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-black/5 bg-paper sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center gap-6">
          <span className="font-display text-2xl tracking-tight">{DEMO_HOUSEHOLD.name}</span>
          <nav className="flex items-center gap-1 text-sm">
            {VIEWS.filter((v) => v.v !== "wall").map((n) => (
              <Link
                key={n.v}
                href={`/demo?view=${n.v}`}
                className={`px-3 py-1.5 rounded-lg ${
                  view === n.v ? "bg-ink text-paper" : "hover:bg-black/5 text-ink/70"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/demo?view=wall" className="btn btn-ghost text-sm">Wall mode</Link>
            <span className="chip bg-cream text-ink/60">Demo</span>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-6">{content}</main>
    </div>
  );
}
