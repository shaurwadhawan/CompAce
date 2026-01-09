import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import NavAuth from "@/components/NavAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CompAce",
  description: "Track competitions, missions, and progress",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-purple-500/30 selection:text-purple-600 min-h-screen relative transition-colors duration-300`}>
        <ThemeProvider>
          {/* Ambient Background Effects */}
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-500">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse" style={{ background: 'var(--blob-1)' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse delay-1000" style={{ background: 'var(--blob-2)' }} />
            <div className="absolute top-[20%] left-[40%] w-[300px] h-[300px] rounded-full blur-[80px]" style={{ background: 'var(--blob-3)' }} />
          </div>

          <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-xl transition-colors duration-300">
            <nav className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="font-bold text-xl tracking-tight flex items-center gap-2 group">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 group-hover:to-purple-400 transition-all duration-300">
                  CompAce
                </span>
              </Link>

              <div className="flex items-center gap-8">
                {/* Navigation */}
                <div className="hidden md:flex items-center gap-1">
                  {[
                    { name: "Competitions", href: "/competitions" },
                    { name: "Tracks", href: "/tracks" },
                    { name: "Dashboard", href: "/dashboard" },
                  ].map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all duration-200"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-4 w-px bg-gray-200 dark:bg-white/10 hidden md:block" />
                  <div className="flex gap-4 text-sm">
                    <Link href="/saved" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Saved</Link>
                    <Link href="/profile" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Profile</Link>
                  </div>
                  <NavAuth />
                </div>
              </div>
            </nav>
          </header>

          <main className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-12">
            {children}
          </main>

          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}

