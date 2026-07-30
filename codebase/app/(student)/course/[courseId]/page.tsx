"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { DayCard, type DayEntry } from "@/components/course/DayCard";
import { useI18n } from "@/components/providers";
import { apiGet } from "@/lib/api-client";
import { toDayEntries } from "@/lib/curriculum";
import type {
  CourseListResponse,
  CourseSummary,
  Curriculum,
  DayCompletion,
} from "@/lib/types";

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const courseSlug = params.courseId.toLowerCase();
  const courseCode = params.courseId.toUpperCase();
  const { dict } = useI18n();

  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [days, setDays] = useState<DayEntry[] | null>(null);
  const [completions, setCompletions] = useState<Record<string, DayCompletion>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [courseList, curriculum] = await Promise.all([
          apiGet<CourseListResponse>("/api/v1/courses/me/courses"),
          apiGet<Curriculum>(`/api/v1/courses/${courseCode}/curriculum`),
        ]);
        if (cancelled) return;

        setCourse(courseList.items.find((item) => item.course_id === courseCode) ?? null);
        const entries = toDayEntries(curriculum);
        setDays(entries);

        // Bản gốc gọi song song một request completion cho mỗi ngày học.
        const results = await Promise.all(
          entries.map((day) =>
            apiGet<DayCompletion>(`/api/v1/days/${day.dayCode}/completion`).catch(() => null),
          ),
        );
        if (cancelled) return;
        setCompletions(
          Object.fromEntries(
            results.filter((item): item is DayCompletion => item !== null).map((item) => [item.day_code, item]),
          ),
        );
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [courseCode]);

  const completedCount = useMemo(
    () => Object.values(completions).filter((item) => item.state === "completed").length,
    [completions],
  );

  const totalDays = days?.length ?? 0;
  const progressPercent = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

  const firstSlide = days?.find((day) => day.slides.length > 0)?.slides[0];
  const startHref = firstSlide
    ? `/course/${courseSlug}/reader?${new URLSearchParams({
        lectureId: firstSlide.lectureId,
        materialId: firstSlide.materialId,
      }).toString()}`
    : `/course/${courseSlug}/reader`;

  const progressText = dict.courseDetail.personalProgressBody(completedCount, totalDays);

  return (
    <PageShell
      title={`${courseCode} - ${course?.course_name ?? ""}`}
      subtitle={dict.courseDetail.subtitle(
        course?.enrolled_student_count ?? 0,
        completedCount,
        totalDays,
      )}
      actions={
        <Link
          href={startHref}
          className="rounded-xl bg-[#124f8c] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0b355f]"
        >
          {dict.courseDetail.startReading}
        </Link>
      }
    >
      <div className="space-y-6">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="animate-fade-in-lift space-y-4 opacity-0">
            {days?.map((day) => (
              <DayCard
                key={day.dayCode}
                courseSlug={courseSlug}
                day={day}
                completed={completions[day.dayCode]?.state === "completed"}
              />
            ))}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {dict.courseDetail.personalProgress}
              </h3>
              <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {progressText.before}
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {progressText.done}
                </span>
                {progressText.middle}
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {progressText.total}
                </span>
                {progressText.after}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
