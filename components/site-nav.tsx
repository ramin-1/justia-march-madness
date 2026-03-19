import Link from "next/link";

const navSections = [
  {
    label: "Public",
    links: [
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/bracket/demo-1", label: "Bracket Demo" },
    ],
  },
  {
    label: "Admin (Protected)",
    links: [
      { href: "/login", label: "Admin Login" },
      { href: "/entries", label: "Admin Entries" },
      { href: "/entries/new", label: "Admin New Entry" },
      { href: "/entries/demo-1/edit", label: "Admin Edit Entry" },
      { href: "/admin/results", label: "Admin Results" },
    ],
  },
];

export function SiteNav() {
  return (
    <nav className="flex flex-wrap items-center gap-4 text-sm">
      {navSections.map((section) => (
        <div key={section.label} className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {section.label}
          </span>
          {section.links.map((link) => (
            <Link key={link.href} href={link.href} className="font-medium">
              {link.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
