"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ProfileMenu({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="profilemenu" ref={ref}>
      <button
        className={`iconbtn avatar${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Profile menu"
        title={name}
      >
        <span style={{ fontWeight: 700, fontSize: 14 }}>{name.slice(0, 1).toUpperCase()}</span>
      </button>
      {open ? (
        <div className="menu" role="menu">
          <p className="menu-name">{name}</p>
          <Link href="/me" role="menuitem" className="menu-item" onClick={() => setOpen(false)}>
            My bets &amp; jokers
          </Link>
          <Link href="/rules" role="menuitem" className="menu-item" onClick={() => setOpen(false)}>
            How it works
          </Link>
          {isAdmin ? (
            <Link href="/admin" role="menuitem" className="menu-item" onClick={() => setOpen(false)}>
              Admin
            </Link>
          ) : null}
          <button role="menuitem" className="menu-item menu-danger" onClick={logout}>
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
