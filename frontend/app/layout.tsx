import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import LenisProvider from "../components/LenisProvider";
import { ScrollDotProvider } from "../components/brand/ScrollDotContext";

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('theme');
                if (!theme) {
                  theme = 'dark';
                }
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <ScrollDotProvider>
          <LenisProvider>
            <Nav />
            <main className="min-h-screen pt-16">
              {children}
            </main>
            <Footer />
          </LenisProvider>
        </ScrollDotProvider>
      </body>
    </html>
  );
}
