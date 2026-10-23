import type { Metadata } from "next";
import "./globals.css";
import "./innovation.css";
import { Shell } from "@/components/layout/shell";
export const metadata: Metadata = {
  title: "IdeaDNA — The Living Ideas Network",
  description:
    "Turn a spark into something we can build. Explore, contribute, and combine ideas with an open community.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
