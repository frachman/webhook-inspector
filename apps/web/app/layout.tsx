import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: "Hookbin by Mikrolyt — Webhook Inspector",
  description: "Hookbin by Mikrolyt: create a temporary webhook URL to inspect requests from Stripe, GitHub, payment gateways, and your own applications.",
  metadataBase: new URL("https://hookbin.mikrolyt.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Hookbin by Mikrolyt — Test and debug webhooks",
    description: "Inspect webhook methods, headers, query parameters, and request bodies before connecting your production endpoint.",
    url: "https://hookbin.mikrolyt.com/",
    siteName: "Mikrolyt",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Hookbin by Mikrolyt — Test and debug webhooks",
    description: "A temporary webhook URL for debugging integrations. A tool by Mikrolyt.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
