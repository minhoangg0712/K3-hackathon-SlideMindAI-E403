import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="group cursor-default rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs transition-all duration-200 hover:scale-[1.02] hover:border-[#134D8B]/35 hover:shadow-sm active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700">
      <div className="flex items-center gap-3.5">
        <div className="rounded-xl border border-[#134D8B]/15 bg-[#134D8B]/5 p-2.5 text-[#134D8B] transition-all duration-300 group-hover:border-[#134D8B] group-hover:bg-[#134D8B] group-hover:text-white dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300 dark:group-hover:border-sky-400 dark:group-hover:bg-sky-400 dark:group-hover:text-slate-950">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            {label}
          </p>
          <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
