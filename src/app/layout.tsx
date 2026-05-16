import type { Metadata, Viewport } from "next";
import { caveat, kalam, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "Bombatique",
  description: "mental math · live · multiplayer",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${caveat.variable} ${kalam.variable} ${jetbrainsMono.variable}`}
    >
      <body style={{ fontFamily: "var(--font-kalam), cursive" }}>
        <div className="mobile-shell">{children}</div>
      </body>
    </html>
  );
}
