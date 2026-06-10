"use client";

import { usePathname, useRouter } from "next/navigation";

// Top-level tab destinations have no back affordance; everything deeper
// (match pages, rules, …) gets a back arrow in the Android-typical top-left spot.
const ROOTS = new Set(["/", "/draw", "/leaderboard", "/me", "/admin", "/login"]);

export function TopBack() {
  const pathname = usePathname();
  const router = useRouter();
  if (ROOTS.has(pathname)) return null;
  return (
    <button
      className="iconbtn topback"
      aria-label="Back"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
