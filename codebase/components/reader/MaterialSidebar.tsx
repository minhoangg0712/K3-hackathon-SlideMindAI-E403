"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, ChevronDown, CirclePlay, PanelLeft } from "lucide-react";
import { useI18n } from "@/components/providers";
import type { DayEntry } from "@/components/course/DayCard";
import type { MaterialDocument } from "@/lib/types";

export function MaterialSidebar({
  courseSlug,
  days,
  documents,
  activeMaterialId,
}: {
  courseSlug: string;
  days: DayEntry[];
  documents: Map<string, MaterialDocument>;
  activeMaterialId: string;
}) {
  const { dict } = useI18n();
  const activeDayCode =
    days.find((day) => day.slides.some((slide) => slide.materialId === activeMaterialId))?.dayCode ??
    days[0]?.dayCode;
  const [expanded, setExpanded] = useState<string | null>(activeDayCode ?? null);

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start gap-3 px-5 py-4">
        <PanelLeft className="mt-0.5 h-5 w-5 shrink-0 text-[#134D8B] dark:text-sky-300" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
            {dict.readerSidebar.title}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {dict.readerSidebar.subtitle}
          </p>
        </div>
      </div>

      <div className="scrollbar-thin-vlearn min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-4">
        {days.length === 0 ? (
          <p className="px-2 text-xs text-slate-500 dark:text-slate-400">
            {dict.readerSidebar.noMaterials}
          </p>
        ) : null}

        {days.map((day) => {
          const isOpen = expanded === day.dayCode;
          const isActiveDay = day.dayCode === activeDayCode;

          return (
            <div
              key={day.dayCode}
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : day.dayCode)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <CirclePlay
                  className="h-4 w-4 shrink-0 text-[#134D8B] dark:text-sky-300"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">
                    {day.title}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {dict.readerSidebar.materialsCount(day.slides.length, "ACTIVE")}
                  </span>
                </span>
                {isActiveDay ? (
                  <span className="shrink-0 rounded-md bg-[#134D8B]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#134D8B] dark:bg-sky-950 dark:text-sky-300">
                    {dict.readerSidebar.studying}
                  </span>
                ) : null}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              {isOpen ? (
                <div className="space-y-1 px-2 pb-2">
                  {day.slides.map((slide) => {
                    const doc = documents.get(slide.materialId);
                    const isActive = slide.materialId === activeMaterialId;
                    const params = new URLSearchParams({
                      lectureId: slide.lectureId,
                      materialId: slide.materialId,
                    });

                    return (
                      <Link
                        key={slide.materialId}
                        href={`/course/${courseSlug}/reader?${params.toString()}`}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors ${
                          isActive
                            ? "bg-[#134D8B]/8 ring-1 ring-[#134D8B]/25 dark:bg-sky-950/60 dark:ring-sky-800"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900"
                        }`}
                      >
                        <CirclePlay
                          className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-[#134D8B] dark:text-sky-300" : "text-slate-400"}`}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-xs font-bold ${
                              isActive
                                ? "text-[#134D8B] dark:text-sky-200"
                                : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {slide.title}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-slate-400 dark:text-slate-500">
                            {dict.readerSidebar.pages(doc?.page_count ?? 0)}
                          </span>
                        </span>
                        {isActive ? (
                          <CheckCircle2
                            className="h-4 w-4 shrink-0 text-[#134D8B] dark:text-sky-300"
                            aria-hidden
                          />
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
