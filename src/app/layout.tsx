import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nextlearn | Proof of skill",
  description: "Practice debugging through realistic incidents and build a clear, learner-controlled record of your work.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
