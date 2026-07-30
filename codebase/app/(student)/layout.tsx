import { AppHeader } from "@/components/layout/AppHeader";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--vlearn-ice)] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppHeader />
      <main>{children}</main>
    </div>
  );
}
