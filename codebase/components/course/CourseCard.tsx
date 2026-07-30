"use client";

import Link from "next/link";
import { Activity, ArrowRight, BookOpen, NotebookTabs } from "lucide-react";
import { useI18n } from "@/components/providers";
import type { CourseSummary } from "@/lib/types";

export function CourseCard({ course }: { course: CourseSummary }) {
  const { dict } = useI18n();
  const slug = course.course_id.toLowerCase();
  const progress = course.reading_progress_percent;

  return (
    <article className="group flex min-h-[230px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-250 hover:scale-[1.02] hover:border-[#134D8B]/30 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500/40">
      <Link
        href={`/course/${slug}`}
        aria-label={dict.courseCard.openCourseAria(course.course_id)}
        className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#134D8B]/40 focus-visible:ring-offset-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="rounded-2xl border border-[#134D8B]/15 bg-[#134D8B]/5 p-3 text-[#134D8B] transition-colors duration-300 group-hover:border-[#134D8B] group-hover:bg-[#134D8B] group-hover:text-white dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300 dark:group-hover:border-sky-500 dark:group-hover:bg-sky-600 dark:group-hover:text-white">
            <BookOpen className="h-5 w-5" aria-hidden />
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            {dict.courseCard.readPercent(progress)}
          </span>
        </div>
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {course.course_id}
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-950 transition-colors group-hover:text-[#134D8B] dark:text-slate-100 dark:group-hover:text-sky-300">
            {course.course_name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {dict.courseCard.description(course.course_name)}
          </p>
        </div>
      </Link>

      <div className="mt-5 space-y-4">
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-[#134D8B] dark:bg-sky-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex flex-col gap-3 text-xs">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Activity className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
            <span className="truncate">{dict.dashboard.readyToStudy}</span>
          </span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href={`/course/${slug}/study-overview`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:border-[#134D8B]/40 hover:text-[#134D8B] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-sky-300"
            >
              <NotebookTabs className="h-3.5 w-3.5" aria-hidden />
              {dict.nav.studyNotebook}
            </Link>
            <Link
              href={`/course/${slug}`}
              className="inline-flex items-center gap-1.5 px-1 text-[11px] font-bold text-[color:var(--vlearn-red)] transition-colors hover:text-[color:var(--vlearn-red-dark)] dark:text-red-300"
            >
              {dict.courseCard.openCourse}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
