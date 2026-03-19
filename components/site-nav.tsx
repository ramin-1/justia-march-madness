import Link from "next/link";

const links = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/entries", label: "Entries" },
  { href: "/admin/results", label: "Results" },
];

export function SiteNav() {
  return (
    <nav className="flex flex-wrap gap-4 text-sm">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="font-medium">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
