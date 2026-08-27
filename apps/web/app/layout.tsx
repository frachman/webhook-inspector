import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Webhook Inspector",
  description: "Create a temporary webhook URL to inspect requests from Stripe, GitHub, payment gateways, and your own applications.",
  metadataBase: new URL("https://hookbin.farandy.id"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Webhook Inspector — Test and debug webhooks",
    description: "Inspect webhook methods, headers, query parameters, and request bodies before connecting your production endpoint.",
    url: "https://hookbin.farandy.id/",
    siteName: "Webhook Inspector",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Webhook Inspector — Test and debug webhooks",
    description: "A temporary webhook URL for debugging integrations.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
