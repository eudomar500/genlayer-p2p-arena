import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "pointmarket",
    template: "%s -- pointmarket",
  },
  description:
    "Trustless P2P marketplace and meta-prediction market. Powered by AI consensus on GenLayer.",
  applicationName: "PointMarket",
  authors: [{ name: "Islandlabs" }],
  keywords: [
    "GenLayer",
    "Intelligent Contracts",
    "P2P marketplace",
    "prediction market",
    "decentralized",
    "AI consensus",
  ],
  metadataBase: new URL("https://pointmarket.app"),
  openGraph: {
    title: "pointmarket",
    description:
      "Trustless P2P marketplace and meta-prediction market on GenLayer.",
    url: "https://pointmarket.app",
    siteName: "PointMarket",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "pointmarket",
    description:
      "Trustless P2P marketplace and meta-prediction market on GenLayer.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
