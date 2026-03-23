import Link from "next/link";
import { auth } from "@/auth";

const publicLinks = [{ href: "/leaderboard", label: "Leaderboard" }];

const adminLoggedInLinks = [
  { href: "/entries", label: "Admin Entries" },
  { href: "/entries/new", label: "Admin New Entry" },
  { href: "/admin/results", label: "Admin Results" },
  { href: "/admin/team-slots", label: "Admin Team Slots" },
];

const adminLoggedOutLinks = [{ href: "/login", label: "Admin Login" }];

export async function SiteNav() {
  const session = await auth();
  const isAdminLoggedIn = Boolean(session?.user);
  const adminLinks = isAdminLoggedIn ? adminLoggedInLinks : adminLoggedOutLinks;
  const navSections = [
    {
      label: "Public",
      links: publicLinks,
    },
    {
      label: "Admin (Protected)",
      links: adminLinks,
    },
  ];

  return (
    <nav className="flex w-full flex-col gap-2 text-sm sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
      {navSections.map((section) => (
        <div
          key={section.label}
          className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:gap-3"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {section.label}
          </span>
          {section.links.map((link) => (
            <Link key={link.href} href={link.href} className="font-medium text-slate-700 hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
