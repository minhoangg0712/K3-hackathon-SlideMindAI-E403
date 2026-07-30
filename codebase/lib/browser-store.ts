/**
 * Store nhỏ cho các giá trị sống ngoài React (class trên <html>,
 * localStorage). Đọc bằng useSyncExternalStore thay vì setState trong effect —
 * nhờ vậy không có cascading render và không nháy giá trị sau hydration.
 */

export type Theme = "light" | "dark";
export type Locale = "vi" | "en";

const THEME_KEY = "vlearn_theme";
const LOCALE_KEY = "vlearn_locale";

/** Script chạy trước hydration để tránh nháy theme. Mặc định light. */
export const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem('${THEME_KEY}')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`;

function createStore<T>(read: () => T, serverValue: T) {
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: read,
    getServerSnapshot: () => serverValue,
    emit() {
      for (const listener of listeners) listener();
    },
  };
}

/* ------------------------------------------------------------------ */
/* Theme — nguồn sự thật là class `dark` trên <html>                   */
/* ------------------------------------------------------------------ */

export const themeStore = createStore<Theme>(
  () => (document.documentElement.classList.contains("dark") ? "dark" : "light"),
  "light",
);

export function toggleTheme(): void {
  const next: Theme = themeStore.getSnapshot() === "dark" ? "light" : "dark";
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* private mode */
  }
  themeStore.emit();
}

/* ------------------------------------------------------------------ */
/* Locale                                                             */
/* ------------------------------------------------------------------ */

export const localeStore = createStore<Locale>(() => {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    return stored === "en" || stored === "vi" ? stored : "vi";
  } catch {
    return "vi";
  }
}, "vi");

export function toggleLocale(): void {
  const next: Locale = localeStore.getSnapshot() === "vi" ? "en" : "vi";
  try {
    localStorage.setItem(LOCALE_KEY, next);
  } catch {
    /* private mode */
  }
  document.documentElement.lang = next;
  localeStore.emit();
}
