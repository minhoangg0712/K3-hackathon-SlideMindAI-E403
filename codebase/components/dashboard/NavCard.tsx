import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function NavCard({
  href,
  title,
  hint,
  icon: Icon,
}: {
  href: string;
  title: string;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs transition-all duration-200 hover:border-[#134D8B]/35 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700"
    >
      <div className="rounded-xl border border-[#134D8B]/15 bg-[#134D8B]/5 p-2.5 text-[#134D8B] transition-all duration-300 group-hover:border-[#134D8B] group-hover:bg-[#134D8B] group-hover:text-white dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300 dark:group-hover:border-sky-400 dark:group-hover:bg-sky-400 dark:group-hover:text-slate-950">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      </div>
      <ArrowRight
        className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-[#134D8B] dark:group-hover:text-sky-300"
        aria-hidden
      />
    </Link>
  );
}
