import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/Toast";
import "./layout.css";

export const metadata: Metadata = {
  title: "妞妞画廊",
  description: "杂志风格的个人照片/视频画廊",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme');
                  var d = t ? t === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches;
                  document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
      </body>
    </html>
  );
}
