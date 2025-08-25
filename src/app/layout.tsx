import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import appConfig from "../../app.config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: appConfig.appName,
  description: appConfig.appDescription,
  icons: {
    icon: [{ url: appConfig.appLogo }],
    shortcut: [{ url: appConfig.appLogo }],
    apple: [{ url: appConfig.appLogo }],
    other: [{ url: appConfig.appLogo }],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="h-1 bg-red-500" />
        {children}
      </body>
    </html>
  );
}
