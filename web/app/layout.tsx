import type { Metadata, Viewport } from "next";
import "./app.css";
import ToastHost from "@/components/Toast";
import RevealHost from "@/components/Reveal";

/** Same convention as lib/stripe.ts appUrl() — set NEXT_PUBLIC_APP_URL in prod
 *  so og/twitter image URLs resolve absolutely. */
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

const TITLE = "BuildSafe — Two apps. One promise: everyone gets paid.";
const DESCRIPTION =
  "BuildSafe is the two-sided platform for Australian construction: customers hire financially-verified builders; tradies and builders get monitored, get work, and get paid.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "BuildSafe",
  icons: {
    // app/favicon.ico + app/icon.svg are also picked up by the file convention;
    // this keeps an explicit SVG link for browsers that prefer it.
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: "BuildSafe",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_AU",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "BuildSafe — everyone gets paid" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-default.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1B2E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <ToastHost />
        <RevealHost />
      </body>
    </html>
  );
}
