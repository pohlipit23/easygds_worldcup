import type { Metadata, Viewport } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavTabs } from "@/components/NavTabs";
import { ProfileMenu } from "@/components/ProfileMenu";
import { TopBack } from "@/components/TopBack";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const jbmono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" });

// Set NEXT_PUBLIC_SITE_URL in the environment to override (e.g. a new domain).
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcup.ota-i.com";

const SHARE_DESCRIPTION =
  "Predict every match, play your jokers, and win the office cup. The altovo World Cup 2026 Tippspiel.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "altovo · World Cup 2026",
  description: "Internal World Cup 2026 prediction game",
  applicationName: "altovo · World Cup 2026",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "altovo · World Cup 2026",
    title: "altovo · World Cup 2026 prediction game",
    description: SHARE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "altovo · World Cup 2026 prediction game",
    description: SHARE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}})()`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className={`${sora.variable} ${jbmono.variable}`}>
        <header className="topbar">
          <TopBack />
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={26} />
            <span className="wordmark">altovo</span>
          </Link>
          <span className="divider" />
          <span className="meta mono">World Cup 2026</span>
          {user ? <ProfileMenu name={user.name} isAdmin={user.is_admin === 1} /> : null}
          <ThemeToggle />
        </header>
        {user ? <NavTabs isAdmin={user.is_admin === 1} /> : null}
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
