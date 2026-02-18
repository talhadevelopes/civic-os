import type { Metadata } from "next";
import { Arvo } from "next/font/google";
import "./globals.css";

const arvo = Arvo({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-arvo",
});

export const metadata: Metadata = {
  title: "CIVICOS",
  description: "AI-powered civic governance accountability platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${arvo.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}