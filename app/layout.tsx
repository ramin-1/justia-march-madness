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
        <header className="border-b border-slate-200 bg-white print:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href="/leaderboard" className="text-base font-semibold text-slate-950 sm:text-lg">
                March Madness Company Challenge
              </Link>
              <p className="text-xs text-slate-500">
                Milestone 8: polish and deployment-ready workflows
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
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
