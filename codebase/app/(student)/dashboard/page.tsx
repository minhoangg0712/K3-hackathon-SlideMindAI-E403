"use client";

import { useEffect, useState } from "react";
import { Activity, BookOpen, Layers, TrendingUp } from "lucide-react";
import { HeaderPill, PageShell } from "@/components/layout/PageShell";
import { NavCard } from "@/components/dashboard/NavCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { WelcomeHero } from "@/components/dashboard/WelcomeHero";
import { useCurrentUser, useI18n } from "@/components/providers";
import { apiGet } from "@/lib/api-client";
import { DASHBOARD_STATS } from "@/data/fixtures";
import type { CourseListResponse, CourseSummary } from "@/lib/types";

export default function DashboardPage() {
  const { dict } = useI18n();
  const user = useCurrentUser();
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

  const courseCount = courses?.length ?? DASHBOARD_STATS.courseCount;
  const studentName = user?.full_name ?? dict.dashboard.defaultStudentName;

  return (
    <PageShell
      title={dict.dashboard.title}
      subtitle={dict.dashboard.subtitle}
      actions={<HeaderPill>{dict.dashboard.coursesInProgress(courseCount)}</HeaderPill>}
    >
      <div className="animate-fade-in-lift space-y-7 opacity-0">
        <WelcomeHero studentName={studentName} />

        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <StatCard
            label={dict.dashboard.metrics.courses}
            value={String(courseCount)}
            icon={BookOpen}
          />
          <StatCard
            label={dict.dashboard.metrics.flashcards}
            value={String(DASHBOARD_STATS.flashcardsViewed)}
            icon={Layers}
          />
          <StatCard
            label={dict.dashboard.metrics.tutorQuestions}
            value={String(DASHBOARD_STATS.tutorQuestions)}
            icon={Activity}
          />
          <StatCard
            label={dict.dashboard.metrics.avgProgress}
            value={`${DASHBOARD_STATS.averageProgressPercent}%`}
            icon={TrendingUp}
          />
        </section>

        <NavCard
          href="/my-courses"
          title={dict.dashboard.viewMyCourses}
          hint={dict.dashboard.viewMyCoursesHint}
          icon={BookOpen}
        />
      </div>
    </PageShell>
  );
}
