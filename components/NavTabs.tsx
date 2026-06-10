"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function TabChevron() {
  return (
    <svg className="tab-chevron" viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <path d="M14 70 L48 14 L82 70" stroke="currentColor" strokeWidth="14" strokeLinejoin="miter" />
    </svg>
  );
}

const TABS = [
  {
    href: "/",
    label: "Matches",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7l4.2 3-1.6 5h-5.2L7.8 10z" />
      </svg>
    ),
  },
  {
    href: "/draw",
    label: "Draw",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 5h5v5H3zM3 14h5v5H3zM16 9.5h5v5h-5zM8 7.5h3v7M8 16.5h3v-4.5M11 12h5" />
      </svg>
    ),
  },
  {
    href: "/leaderboard",
    label: "Standings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 20V10M12 20V4M19 20v-7" />
      </svg>
    ),
  },
  {
    href: "/me",
    label: "My bets",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
      </svg>
    ),
  },
];

export function NavTabs({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const tabs = isAdmin
    ? [
        ...TABS,
        {
          href: "/admin",
          label: "Admin",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2" />
            </svg>
          ),
        },
      ]
    : TABS;

  return (
    <div className="tabbar-wrap">
      <nav className="tabbar">
        {tabs.map((t) => {
          const active =
            t.href === "/"
              ? pathname === "/" || pathname.startsWith("/match")
              : pathname.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={active ? "active" : ""}>
              {active ? <TabChevron /> : null}
              {t.icon}
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
