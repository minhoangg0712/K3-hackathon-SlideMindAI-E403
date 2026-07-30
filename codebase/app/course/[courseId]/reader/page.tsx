"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, PanelRightClose, PanelRightOpen, UserRound } from "lucide-react";
import { ReaderWorkspace } from "@/components/reader/ReaderWorkspace";
import { VinUniMark } from "@/components/layout/VLearnLogo";
import { useCurrentUser, useI18n, useTheme } from "@/components/providers";
import { apiGet } from "@/lib/api-client";
import { toDayEntries } from "@/lib/curriculum";
import type { DayEntry } from "@/components/course/DayCard";
import type { Curriculum, DocumentListResponse, MaterialDocument } from "@/lib/types";

export default function ReaderPage() {
  const params = useParams<{ courseId: string }>();
  const searchParams = useSearchParams();
  const courseSlug = params.courseId.toLowerCase();
  const courseCode = params.courseId.toUpperCase();
  const lectureId = searchParams.get("lectureId") ?? "";
  const { dict } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const user = useCurrentUser();

  const [days, setDays] = useState<DayEntry[]>([]);
  const [documents, setDocuments] = useState<MaterialDocument[]>([]);
  const [tutorOpen, setTutorOpen] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiGet<Curriculum>(`/api/v1/courses/${courseCode}/curriculum`),
      apiGet<DocumentListResponse>(`/api/v1/documents?course_id=${courseCode}`),
    ])
      .then(([curriculum, docs]) => {
        if (controller.signal.aborted) return;
        setDays(toDayEntries(curriculum));
        setDocuments(docs.items);
      })
      .catch(() => {
        /* sidebar hiển thị trạng thái rỗng */
      });
    return () => controller.abort();
  }, [courseCode]);

  const documentMap = useMemo(
    () => new Map(documents.map((doc) => [doc.material_id, doc])),
    [documents],
  );

  // materialId từ URL; nếu thiếu thì lấy tài liệu đầu tiên của khóa.
  const materialId =
    searchParams.get("materialId") ??
    days.find((day) => day.slides.length > 0)?.slides[0]?.materialId ??
    "";
  const activeDoc = documentMap.get(materialId);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950">
        <Link
          href={`/course/${courseSlug}`}
          aria-label={dict.readerHeader.back}
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Link>
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <VinUniMark className="h-6 w-6" />
          <span className="text-base font-black tracking-[-0.035em] text-[color:var(--vlearn-navy-dark)] dark:text-white">
            <span className="text-[#d6222f] dark:text-red-300">V</span>Learn
          </span>
        </Link>
        <div className="ml-2 min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
            {activeDoc?.file_name ?? dict.readerHeader.defaultTitle}
          </p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {courseCode}
            {lectureId ? ` · ${lectureId}` : ""}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? dict.account.toLight : dict.account.toDark}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">
            <UserRound className="h-3.5 w-3.5" aria-hidden />
            {user?.full_name ?? dict.readerHeader.anonymousStudent}
          </span>
          <button
            type="button"
            onClick={() => setTutorOpen((open) => !open)}
            aria-label={tutorOpen ? dict.readerChat.hideAssistant : dict.readerChat.openAssistant}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {tutorOpen ? (
              <PanelRightClose className="h-4 w-4" aria-hidden />
            ) : (
              <PanelRightOpen className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {activeDoc ? (
          // key theo material_id: đổi tài liệu là trang đọc và đoạn bôi đen reset.
          <ReaderWorkspace
            key={activeDoc.material_id}
            courseSlug={courseSlug}
            courseCode={courseCode}
            days={days}
            documents={documentMap}
            activeDoc={activeDoc}
            tutorOpen={tutorOpen}
          />
        ) : (
          <div className="flex min-w-0 flex-1 items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-900">
            {dict.readerSidebar.noMaterials}
          </div>
        )}
      </div>
    </div>
  );
}
