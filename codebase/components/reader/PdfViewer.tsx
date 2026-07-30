"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Highlighter,
  Loader2,
  MousePointer2,
  Pen,
  Plus,
  Minus,
  MoreHorizontal,
} from "lucide-react";
import { useI18n } from "@/components/providers";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Worker + font data được copy vào public/ bởi `npm run setup:pdfjs`.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

/**
 * Không có standardFontDataUrl thì pdfjs không vẽ được các base-14 font
 * (Helvetica, Times…) và trang hiện ra trắng trơn.
 */
const PDF_OPTIONS = {
  standardFontDataUrl: "/pdfjs/standard_fonts/",
  cMapUrl: "/pdfjs/cmaps/",
  cMapPacked: true,
} as const;

const TOOL_BUTTON =
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors";

export function PdfViewer({
  fileUrl,
  fileName,
  pageCount,
  currentPage,
  onPageChange,
  onSelectText,
}: {
  fileUrl: string;
  fileName: string;
  pageCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSelectText: (text: string) => void;
}) {
  const { dict } = useI18n();
  const [zoom, setZoom] = useState(100);
  const [loadedPages, setLoadedPages] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Bỏ qua observer trong lúc đang cuộn theo lệnh, tránh đánh nhau với nó.
  const programmaticScroll = useRef(false);

  const totalPages = loadedPages ?? pageCount;

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Trang nào chiếm phần lớn khung nhìn thì coi là trang đang đọc.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || loadedPages === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticScroll.current) return;
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;
        const page = Number((best.target as HTMLElement).dataset.page);
        if (page) onPageChange(page);
      },
      { root, threshold: [0.25, 0.5, 0.75] },
    );

    // Các trang được đánh dấu bằng data-page, nên không cần giữ Map ref riêng.
    for (const element of root.querySelectorAll("[data-page]")) observer.observe(element);
    return () => observer.disconnect();
  }, [loadedPages, onPageChange]);

  const scrollToPage = useCallback((page: number) => {
    const element = scrollRef.current?.querySelector(`[data-page="${page}"]`);
    if (!element) return;
    programmaticScroll.current = true;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      programmaticScroll.current = false;
    }, 600);
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.min(Math.max(page, 1), totalPages);
      onPageChange(clamped);
      scrollToPage(clamped);
    },
    [onPageChange, scrollToPage, totalPages],
  );

  // Bôi đen trên slide -> đẩy lên Tutor làm ngữ cảnh.
  const handleMouseUp = useCallback(() => {
    const selected = window.getSelection()?.toString().trim();
    if (selected) onSelectText(selected);
  }, [onSelectText]);

  const pageWidth = containerWidth > 0 ? ((containerWidth - 64) * zoom) / 100 : undefined;

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-slate-100 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-3">
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <button
            type="button"
            className={`${TOOL_BUTTON} bg-[#134D8B]/10 text-[#134D8B] dark:bg-sky-950 dark:text-sky-300`}
          >
            <MousePointer2 className="h-3.5 w-3.5" aria-hidden />
            {dict.readerToolbar.read}
          </button>
          {/* Bút và Highlight nằm ngoài phạm vi bản dựng lại này. */}
          <button
            type="button"
            disabled
            title={dict.readerToolbar.pen}
            className={`${TOOL_BUTTON} text-slate-400 dark:text-slate-600`}
          >
            <Pen className="h-3.5 w-3.5" aria-hidden />
            {dict.readerToolbar.pen}
          </button>
          <button
            type="button"
            disabled
            title={dict.readerToolbar.highlight}
            className={`${TOOL_BUTTON} text-slate-400 dark:text-slate-600`}
          >
            <Highlighter className="h-3.5 w-3.5" aria-hidden />
            {dict.readerToolbar.highlight}
          </button>
          <button
            type="button"
            disabled
            title={dict.readerToolbar.moreTip}
            className={`${TOOL_BUTTON} text-slate-400 dark:text-slate-600`}
          >
            <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <span className="text-xs font-bold text-[#134D8B] dark:text-sky-300">
            {dict.readerToolbar.page(currentPage, totalPages)}
          </span>
          <span className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(50, value - 10))}
            aria-label={dict.readerToolbar.zoomOut}
            className="text-slate-500 transition-colors hover:text-[#134D8B] dark:text-slate-400"
          >
            <Minus className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            title={dict.readerToolbar.zoomReset}
            className="min-w-[42px] text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            {zoom}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(200, value + 10))}
            aria-label={dict.readerToolbar.zoomIn}
            className="text-slate-500 transition-colors hover:text-[#134D8B] dark:text-slate-400"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </button>
          <span className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <a
            href={fileUrl}
            download={fileName}
            title={dict.readerToolbar.download}
            className="text-slate-500 transition-colors hover:text-[#134D8B] dark:text-slate-400"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>

      <div
        ref={scrollRef}
        onMouseUp={handleMouseUp}
        className="scrollbar-thin-vlearn min-h-0 flex-1 overflow-y-auto px-8 pb-6"
      >
        <Document
          file={fileUrl}
          options={PDF_OPTIONS}
          onLoadSuccess={({ numPages }) => {
            setLoadedPages(numPages);
            setLoadError(false);
          }}
          onLoadError={() => setLoadError(true)}
          loading={
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {dict.canvas.loading}
            </div>
          }
          error={
            <div className="py-24 text-center text-sm font-semibold text-red-600 dark:text-red-400">
              {dict.canvas.failed}
            </div>
          }
          className="flex flex-col items-center gap-6"
        >
          {loadError
            ? null
            : Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <div
                  key={page}
                  data-page={page}
                  className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-slate-200"
                >
                  <Page pageNumber={page} width={pageWidth} />
                </div>
              ))}
        </Document>
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label={dict.readerToolbar.prevPage}
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {dict.readerToolbar.page(currentPage, totalPages)}
        </span>
        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label={dict.readerToolbar.nextPage}
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
