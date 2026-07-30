import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { AppProviders, THEME_INIT_SCRIPT } from "@/components/providers";
import "./globals.css";

// Bản gốc dùng Be Vietnam Pro cho toàn bộ giao diện.
const appSans = Be_Vietnam_Pro({
  variable: "--font-app-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const appMono = JetBrains_Mono({
  variable: "--font-app-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VLearn",
  description: "Không gian học tập VLearn — VinUni AI Thực Chiến",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Script inline dưới đây set class `dark` trước hydration, nên chênh lệch
    // class/style trên <html> là có chủ đích.
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${appSans.variable} ${appMono.variable} h-full antialiased`}
    >
      <head>
        {/* Đặt class dark trước khi React hydrate để không nháy theme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-[#24679f]/20 selection:text-[#0b355f] dark:bg-slate-950 dark:text-slate-100 dark:selection:bg-sky-400/20 dark:selection:text-sky-100">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
