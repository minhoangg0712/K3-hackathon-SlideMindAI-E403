"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { DICTIONARIES, type Dictionary } from "@/lib/i18n";
import {
  localeStore,
  themeStore,
  toggleLocale,
  toggleTheme,
  type Locale,
  type Theme,
} from "@/lib/browser-store";
import { apiGet } from "@/lib/api-client";
import type { CurrentUser } from "@/lib/types";

export { THEME_INIT_SCRIPT } from "@/lib/browser-store";

/* ------------------------------------------------------------------ */
/* Theme                                                              */
/* ------------------------------------------------------------------ */

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot,
  );
  return { theme, toggleTheme };
}

/* ------------------------------------------------------------------ */
/* i18n                                                               */
/* ------------------------------------------------------------------ */

export function useI18n(): { locale: Locale; dict: Dictionary; toggleLocale: () => void } {
  const locale = useSyncExternalStore(
    localeStore.subscribe,
    localeStore.getSnapshot,
    localeStore.getServerSnapshot,
  );
  return { locale, dict: DICTIONARIES[locale], toggleLocale };
}

/* ------------------------------------------------------------------ */
/* Current user                                                        */
/* ------------------------------------------------------------------ */

const UserContext = createContext<CurrentUser | null>(null);

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiGet<CurrentUser>("/api/v1/auth/me")
      .then((value) => {
        // setState bất đồng bộ sau khi request về, không phải trong effect body.
        if (!controller.signal.aborted) setUser(value);
      })
      .catch(() => {
        /* header hiển thị trạng thái rỗng nếu không lấy được */
      });
    return () => controller.abort();
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useCurrentUser(): CurrentUser | null {
  return useContext(UserContext);
}

/* ------------------------------------------------------------------ */

/** Giữ thuộc tính lang của <html> đúng với locale đã lưu, kể cả lần load đầu. */
function HtmlLangSync() {
  const { locale } = useI18n();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <HtmlLangSync />
      {children}
    </UserProvider>
  );
}
