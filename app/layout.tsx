import type { ReactNode } from "react";
import "./globals.css";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

export const metadata = {
  title: "March Madness Company Challenge",
  description: "Company bracket challenge tracker",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <Link href="/leaderboard" className="text-lg font-semibold text-slate-950">
                March Madness Company Challenge
              </Link>
              <p className="text-xs text-slate-500">
                Public leaderboard + protected admin management
              </p>
            </div>
            <SiteNav />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
