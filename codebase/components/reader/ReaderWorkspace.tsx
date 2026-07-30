"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { MaterialSidebar } from "@/components/reader/MaterialSidebar";
import { TutorPanel } from "@/components/reader/TutorPanel";
import type { DayEntry } from "@/components/course/DayCard";
import type { MaterialDocument } from "@/lib/types";

// react-pdf chạm vào DOM/worker nên phải nằm ngoài SSR.
const PdfViewer = dynamic(
  () => import("@/components/reader/PdfViewer").then((module) => module.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 bg-slate-100 text-sm text-slate-500 dark:bg-slate-900">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Đang tải trình đọc PDF...
      </div>
    ),
  },
);

/**
 * Vùng làm việc của một học liệu. Trang reader render component này với
 * `key={materialId}`, nên đổi tài liệu là state (trang đang đọc, đoạn bôi đen)
 * tự reset — không cần setState trong effect.
 */
export function ReaderWorkspace({
  courseSlug,
  courseCode,
  days,
  documents,
  activeDoc,
  tutorOpen,
}: {
  courseSlug: string;
  courseCode: string;
  days: DayEntry[];
  documents: Map<string, MaterialDocument>;
  activeDoc: MaterialDocument;
  tutorOpen: boolean;
}) {
  const [page, setPage] = useState(1);
  const [selectedText, setSelectedText] = useState("");

  return (
    <>
      <MaterialSidebar
        courseSlug={courseSlug}
        days={days}
        documents={documents}
        activeMaterialId={activeDoc.material_id}
      />

      <PdfViewer
        fileUrl={activeDoc.pdf_url}
        fileName={activeDoc.file_name}
        pageCount={activeDoc.page_count}
        currentPage={page}
        onPageChange={setPage}
        onSelectText={setSelectedText}
      />

      {tutorOpen ? (
        <TutorPanel
          scope={{
            course_id: courseCode,
            lecture_id: activeDoc.lecture_id,
            material_id: activeDoc.material_id,
          }}
          pageNumber={page}
          selectedText={selectedText}
          onConsumeSelection={() => setSelectedText("")}
        />
      ) : null}
    </>
  );
}
