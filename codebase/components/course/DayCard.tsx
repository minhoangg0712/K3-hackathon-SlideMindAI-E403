"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { useI18n } from "@/components/providers";

export interface DaySlide {
  materialId: string;
  lectureId: string;
  title: string;
}

export interface DayEntry {
  dayCode: string;
  title: string;
  slides: DaySlide[];
}

function readerHref(courseSlug: string, slide: DaySlide) {
  const params = new URLSearchParams({
    lectureId: slide.lectureId,
    materialId: slide.materialId,
  });
  return `/course/${courseSlug}/reader?${params.toString()}`;
}

const SLIDE_BUTTON =
  "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-all duration-200 hover:border-indigo-600 hover:bg-indigo-50/50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500/60 dark:hover:bg-slate-700 dark:hover:text-indigo-300";

export function DayCard({
  courseSlug,
  day,
  completed,
}: {
  courseSlug: string;
  day: DayEntry;
  completed: boolean;
}) {
  const { dict } = useI18n();
  const primary = day.slides[0] ?? null;
  const dayNumber = day.dayCode.split("-")[1] ?? day.dayCode;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 ${
        completed
          ? "border-emerald-200 bg-gradient-to-br from-white to-emerald-50/20 dark:border-emerald-900/50 dark:from-slate-900 dark:to-emerald-950/20"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      <div className="flex flex-col justify-between gap-5 p-5 md:flex-row md:items-center md:p-6">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full font-sans ${
              completed
                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-950"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <span className="text-[9px] font-bold uppercase leading-none tracking-wider opacity-85">
              {dict.courseDetail.day}
            </span>
            <span className="mt-0.5 text-lg font-black leading-none">{dayNumber}</span>
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-slate-900 md:text-base dark:text-slate-100">
              {day.title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {completed ? dict.courseDetail.completed : dict.courseDetail.notCompleted}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {primary ? (
            <Link href={readerHref(courseSlug, primary)} className={SLIDE_BUTTON}>
              <FileText className="h-3.5 w-3.5" aria-hidden />
              <span>{dict.courseDetail.readSlide}</span>
            </Link>
          ) : (
            <span className="text-xs text-slate-400">{dict.courseDetail.noMaterial}</span>
          )}

          {day.slides.length > 1 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {dict.courseDetail.otherSlides(day.slides.length)}
              </span>
              {day.slides.map((slide, index) => (
                <Link
                  key={slide.materialId}
                  href={readerHref(courseSlug, slide)}
                  className={SLIDE_BUTTON}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="max-w-[220px] truncate">
                    {slide.title.trim() || `Slide ${index + 1}`}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
