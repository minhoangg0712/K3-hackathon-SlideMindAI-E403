"use client";

import { useI18n } from "@/components/providers";

export function WelcomeHero({ studentName }: { studentName: string }) {
  const { dict } = useI18n();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#134D8B]/15 bg-white p-6 shadow-xs md:p-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[#134D8B]" />
      {/* Khối đỏ vát chéo ở góc phải — clip-path lấy đúng từ bản gốc. */}
      <div
        className="absolute right-0 top-0 h-full w-28 bg-[#C72127]"
        style={{ clipPath: "polygon(38% 0, 100% 0, 100% 100%, 0 100%)" }}
      />
      <div className="relative max-w-3xl">
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#C72127] dark:text-red-300">
          {dict.brand.eyebrow}
        </p>
        <h2 className="text-xl font-black text-[#134D8B] md:text-2xl dark:text-sky-300">
          {dict.dashboard.welcomeBack(studentName)}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base dark:text-slate-300">
          {dict.dashboard.heroBody}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#134D8B]/15 bg-[#134D8B]/5 px-3 py-1.5 text-xs font-bold text-[#134D8B] shadow-xs dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#134D8B] dark:bg-sky-300" />
            {dict.dashboard.signalActive}
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#C72127]/15 bg-[#C72127]/5 px-3 py-1.5 text-xs font-bold text-[#C72127] shadow-xs dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {dict.dashboard.mission}
          </div>
        </div>
      </div>
    </div>
  );
}
