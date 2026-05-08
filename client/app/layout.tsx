import "./globals.css";
import { Providers } from "./providers"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className="h-full" suppressHydrationWarning>
      <body className={`antialiased min-h-screen flex flex-col`}>
        <Providers>
          <main className="flex-grow">
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
