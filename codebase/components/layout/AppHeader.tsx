"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookOpen, ExternalLink, House, LogOut, Moon, NotebookTabs, Sun } from "lucide-react";
import { useCurrentUser, useI18n, useTheme } from "@/components/providers";
import { VinUniMark } from "./VLearnLogo";

const CODELABS_URL = "https://codelabs.vlearn.dev";

/** Tab điều hướng có gạch chân đỏ trượt vào khi active, giống bản gốc. */
function NavTab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof House;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative inline-flex items-center gap-2 px-4 py-3 text-[15px] font-semibold transition-colors after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:rounded-full after:bg-[color:var(--vlearn-red)] after:transition-transform ${
        active
          ? "text-[color:var(--vlearn-navy)] after:scale-x-100 dark:text-sky-300"
          : "text-slate-600 after:scale-x-0 hover:text-[color:var(--vlearn-navy)] hover:after:scale-x-100 dark:text-slate-300 dark:hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}

const CONTROL_BASE =
  "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg border border-[color:var(--vlearn-navy)]/15 bg-white/80 px-1.5 text-[11px] font-bold text-[color:var(--vlearn-navy)] transition-colors hover:bg-[color:var(--vlearn-ice)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--vlearn-navy)]/40 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-200 dark:hover:bg-slate-800";

export function AppHeader() {
  const pathname = usePathname();
  const { dict, locale, toggleLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const user = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  // Tab "Sổ tay học tập" chỉ hiện khi đang ở trong một khóa học.
  const courseMatch = pathname.match(/^\/course\/([^/]+)/);
  const initial = (user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-[0_3px_5px_rgba(57,63,72,0.12)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <VinUniMark className="h-7 w-7 shrink-0 drop-shadow-sm" />
          <span className="text-base font-black tracking-[-0.035em] text-[color:var(--vlearn-navy-dark)] dark:text-white">
            <span className="text-[#d6222f] dark:text-red-300">V</span>Learn
          </span>
        </Link>

        <nav className="ml-4 hidden min-w-0 flex-1 items-center gap-1 lg:flex">
          <NavTab
            href="/dashboard"
            label={dict.nav.home}
            icon={House}
            active={pathname === "/dashboard"}
          />
          <NavTab
            href="/my-courses"
            label={dict.nav.myCourses}
            icon={BookOpen}
            active={pathname.startsWith("/my-courses") || pathname.startsWith("/course/")}
          />
          {courseMatch ? (
            <NavTab
              href={`/course/${courseMatch[1]}/study-overview`}
              label={dict.nav.studyNotebook}
              icon={NotebookTabs}
              active={pathname.endsWith("/study-overview")}
            />
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <a
            href={CODELABS_URL}
            target="_blank"
            rel="noreferrer"
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-[color:var(--vlearn-navy)]/25 px-2.5 text-[11px] font-bold text-slate-500 transition-colors hover:border-[color:var(--vlearn-navy)]/40 hover:bg-[color:var(--vlearn-navy)]/5 hover:text-[color:var(--vlearn-navy)] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-sky-200"
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{dict.account.openCodelabs}</span>
          </a>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleLocale}
              title={dict.account.switchLanguage}
              aria-label={dict.account.switchLanguage}
              className={CONTROL_BASE}
            >
              {locale.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? dict.account.toLight : dict.account.toDark}
              aria-label={theme === "dark" ? dict.account.toLight : dict.account.toDark}
              className={CONTROL_BASE}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" aria-hidden />
              ) : (
                <Moon className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={dict.account.openAccountMenu}
              aria-expanded={menuOpen}
              className="inline-flex h-8 max-w-[210px] items-center gap-1.5 rounded-lg border border-[color:var(--vlearn-navy)]/15 bg-[color:var(--vlearn-ice)] py-1 pr-2 pl-1 text-[11px] font-bold text-[color:var(--vlearn-navy)] transition-colors hover:bg-[color:var(--vlearn-navy)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--vlearn-navy)]/40 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-200 dark:hover:bg-slate-800"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[color:var(--vlearn-navy)] dark:bg-sky-900 dark:text-sky-100">
                {initial}
              </span>
              <span className="hidden max-w-[130px] truncate xl:inline">{user?.email ?? ""}</span>
            </button>

            {menuOpen ? (
              <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {dict.account.accountMenuTitle}
                </p>
                <p className="mt-1.5 truncate text-sm font-bold text-slate-900 dark:text-white">
                  {user?.full_name ?? ""}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user?.email ?? ""}
                </p>
                <dl className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500 dark:text-slate-400">
                      {dict.account.roleField}
                    </dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">
                      {dict.roles.student}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500 dark:text-slate-400">
                      {dict.account.cohortField}
                    </dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">
                      Khoá 3 + 4
                    </dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  {dict.account.logout}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
