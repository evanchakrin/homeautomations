"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { Meal, MealType } from "@/lib/supabase/types";
import { fromIsoDate, plusDays, isoDate } from "@/lib/dates";
import { setMealAction } from "@/app/(app)/meals/actions";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export function MealsApp({ from, meals }: { from: string; meals: Meal[]; rangeTo?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const start = fromIsoDate(from);
  const days = Array.from({ length: 14 }, (_, i) => plusDays(start, i));
  const byKey = new Map(meals.map((m) => [`${m.date}:${m.meal_type}`, m]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Meal plan</h1>
        <p className="text-ink/60 text-sm">Two weeks of breakfasts, lunches, and dinners.</p>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "120px repeat(3, 1fr)" }}>
        <div />
        {MEAL_TYPES.map((t) => (
          <div key={t} className="text-xs uppercase tracking-wide text-ink/50 px-2 capitalize">{t}</div>
        ))}
        {days.map((d) => {
          const key = isoDate(d);
          return (
            <DayRow
              key={key}
              date={d}
              meals={MEAL_TYPES.map((t) => byKey.get(`${key}:${t}`) ?? null)}
              onSave={(meal_type, title) => {
                startTransition(async () => {
                  await setMealAction({ date: key, meal_type, title, notes: null });
                  router.refresh();
                });
              }}
              pending={pending}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayRow({
  date, meals, onSave, pending,
}: {
  date: Date;
  meals: (Meal | null)[];
  onSave: (m: MealType, title: string) => void;
  pending: boolean;
}) {
  const today = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  return (
    <>
      <div className={`p-3 rounded-xl ${today ? "bg-cream" : ""}`}>
        <div className="text-xs uppercase tracking-wide text-ink/50">{format(date, "EEE")}</div>
        <div className="font-display text-2xl">{format(date, "d")}</div>
      </div>
      {MEAL_TYPES.map((t, i) => (
        <MealCell
          key={t}
          initial={meals[i]?.title ?? ""}
          onSave={(v) => onSave(t, v)}
          disabled={pending}
        />
      ))}
    </>
  );
}

function MealCell({ initial, onSave, disabled }: { initial: string; onSave: (v: string) => void; disabled: boolean }) {
  const [val, setVal] = useState(initial);
  return (
    <input
      className="input"
      placeholder="—"
      value={val}
      disabled={disabled}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => { if (val !== initial) onSave(val); }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
    />
  );
}
