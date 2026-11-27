import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "gh-spotlight - Your GitHub, in a good light.",
  description:
    "Create crisp, Primer-inspired GitHub profile cards for your README. Five themes. Retina-ready PNGs. Made for open source.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
