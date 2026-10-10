import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofLoop | Show what you can do",
  description: "Practice debugging through realistic incidents and build a clear record of your work.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
