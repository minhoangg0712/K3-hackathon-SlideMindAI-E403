"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/components/providers";

/**
 * Khối tiêu đề trang dùng chung cho dashboard / my-courses / course detail
 * (bản gốc gọi là StudentPageShell): eyebrow + h1 + subtitle bên trái,
 * slot actions bên phải, rồi vùng nội dung nền ice.
 */
export function PageShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { dict } = useI18n();

  return (
    <>
      <header className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--vlearn-red)] dark:text-red-300">
                {dict.brand.eyebrow}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-6 dark:bg-slate-950">
        <div className="mx-auto w-full max-w-[1440px]">{children}</div>
      </div>
    </>
  );
}

/** Pill "N khóa học đang theo học" ở góc phải header trang. */
export function HeaderPill({ children }: { children: ReactNode }) {
  return (
    <div className="cursor-default rounded-full border border-[#134D8B]/15 bg-white px-3.5 py-1.5 text-xs font-bold text-[#134D8B] shadow-sm transition-transform hover:scale-[1.03] active:scale-[0.97] dark:border-sky-900 dark:bg-slate-900 dark:text-sky-200">
      {children}
    </div>
  );
}
