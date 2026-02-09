import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Volley Stats",
  description: "Volleyball statistics analyzer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
