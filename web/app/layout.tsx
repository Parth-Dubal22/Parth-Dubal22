import type { Metadata } from "next";
import "./app.css";
import ToastHost from "@/components/Toast";
import RevealHost from "@/components/Reveal";

export const metadata: Metadata = {
  title: "BuildSafe — Two apps. One promise: everyone gets paid.",
  description:
    "BuildSafe is the two-sided platform for Australian construction: customers hire financially-verified builders; tradies and builders get monitored, get work, and get paid.",
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
