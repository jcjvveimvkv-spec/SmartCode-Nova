import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LiveChatButton from "./components/LiveChatButton";
import ThemeProvider from "@/app/providers/ThemeProvider";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Jivo script removed - using 2-in-1 WhatsApp+Jivo button instead */}
      </head>
      <body className={`${inter.className} bg-[#0b0e14] text-white dark:bg-[#0b0e14] dark:text-white light:bg-[#f3f4f6] light:text-[#111827] transition-colors duration-300`}>
        <ThemeProvider>
          {children}
          <LiveChatButton />
        </ThemeProvider>
      </body>
    </html>
  );
}