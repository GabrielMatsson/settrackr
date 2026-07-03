import "./globals.css";
import type { Metadata, Viewport } from "next"
import { Providers } from "./providers"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4f46e5",
}

export const metadata: Metadata = {
  title: "SetTrackr",
  description: "Track your gym workouts",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "SetTrackr",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className="h-full" suppressHydrationWarning>
      <body className={`antialiased min-h-screen flex flex-col`}>
        <Providers>
          <main className="flex-grow flex flex-col">
            {children}
          </main>

          <footer className="p-4 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
            © 2026 SetTrackr
          </footer>
        </Providers>
      </body>
    </html>
  );
}
