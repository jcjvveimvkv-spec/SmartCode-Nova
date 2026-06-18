import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SmartCodeNova - AI Trading Bots",
  description: "Automated trading bots powered by AI for smart investors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* TRADINGVIEW TICKER TAPE SCRIPT */}
        <script 
          type="module" 
          src="https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js"
        ></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}