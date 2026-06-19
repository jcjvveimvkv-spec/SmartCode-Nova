import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LiveChatButton from "./components/LiveChatButton"; // Import global chat button

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
        {/* Global JivoChat Script - loads on ALL pages */}
        <script src="//code.jivosite.com/widget/CCCmjzz7Pl" async></script>
      </head>
      <body className={inter.className}>
        {children}
        {/* The global 2-in-1 Live Chat Button appears on EVERY page */}
        <LiveChatButton />
      </body>
    </html>
  );
}