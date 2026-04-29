"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function MonthCarousel({
  monthIndex, year, onMonthChange, onYearChange,
}: {
  monthIndex: number;
  year: number;
  onMonthChange: (m: number, y: number) => void;
  onYearChange: (y: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [pill, setPill] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const btn = buttonRefs.current[monthIndex];
    const container = containerRef.current;
    if (!btn || !container) return;
    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    setPill({ left: bRect.left - cRect.left, width: bRect.width });
    btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [monthIndex, year]);

  // Recompute on resize so the pill stays aligned.
  useEffect(() => {
    const onResize = () => {
      const btn = buttonRefs.current[monthIndex];
      const container = containerRef.current;
      if (!btn || !container) return;
      const cRect = container.getBoundingClientRect();
      const bRect = btn.getBoundingClientRect();
      setPill({ left: bRect.left - cRect.left, width: bRect.width });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [monthIndex]);

  return (
    <div className="card p-2 flex items-center gap-2">
      <button
        onClick={() => onYearChange(year - 1)}
        className="btn btn-ghost px-2 text-sm tabular-nums"
        aria-label="Previous year"
      >‹ {year - 1}</button>

      <div ref={containerRef} className="relative flex-1 overflow-x-auto no-scrollbar">
        <div
          aria-hidden
          className="absolute top-1 bottom-1 rounded-lg bg-ink transition-all duration-300 ease-out"
          style={{ left: pill.left, width: pill.width }}
        />
        <div className="relative flex gap-1 px-1 py-1">
          {MONTHS.map((m, i) => {
            const active = i === monthIndex;
            return (
              <button
                key={m}
                ref={(el) => { buttonRefs.current[i] = el; }}
                onClick={() => onMonthChange(i, year)}
                className={`relative z-10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                  active ? "text-paper" : "text-ink/60 hover:text-ink"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => onYearChange(year + 1)}
        className="btn btn-ghost px-2 text-sm tabular-nums"
        aria-label="Next year"
      >{year + 1} ›</button>
    </div>
  );
}
