"use client";

import { useEffect, useState } from "react";
import { NotebookTabs } from "lucide-react";
import { HeaderPill, PageShell } from "@/components/layout/PageShell";
import { NavCard } from "@/components/dashboard/NavCard";
import { CourseCard } from "@/components/course/CourseCard";
import { useI18n } from "@/components/providers";
import { apiGet } from "@/lib/api-client";
import type { CourseListResponse, CourseSummary } from "@/lib/types";

export default function MyCoursesPage() {
  const { dict } = useI18n();
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<CourseListResponse>("/api/v1/courses/me/courses")
      .then((data) => {
        if (!cancelled) setCourses(data.items);
      })
      .catch(() => {
        if (!cancelled) setCourses([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const firstCourse = courses?.[0];

  return (
    <PageShell
      title={dict.dashboard.myCourses}
      subtitle={dict.dashboard.myCoursesSubtitle}
      actions={<HeaderPill>{dict.dashboard.coursesInProgress(courses?.length ?? 0)}</HeaderPill>}
    >
      <div className="animate-fade-in-lift space-y-6 opacity-0">
        {courses === null ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {dict.dashboard.loadingCourses}
          </p>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {dict.dashboard.emptyTitle}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {dict.dashboard.emptyBody}
            </p>
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.course_id} course={course} />
            ))}
          </section>
        )}

        {firstCourse ? (
          <div className="grid gap-4 md:grid-cols-2">
            <NavCard
              href={`/course/${firstCourse.course_id.toLowerCase()}/study-overview`}
              title={dict.nav.studyNotebook}
              hint={dict.dashboard.studyNotebookHint}
              icon={NotebookTabs}
            />
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
