import type { ReactNode } from "react";
import "./globals.css";
import Link from "next/link";
import { AdminSessionControl } from "@/components/admin-session-control";
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
                Milestone 4: multi-type bracket editor and viewer
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <SiteNav />
              <AdminSessionControl />
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
