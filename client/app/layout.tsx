import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className="h-full">
      <body className={`antialiased min-h-screen flex flex-col`}>

        <main className="flex-grow">
          {children}
        </main>

        <footer className="p-4 border-t text-center text-sm">
          © 2026 SetTrackr
        </footer>

      </body>
    </html>
  );
}