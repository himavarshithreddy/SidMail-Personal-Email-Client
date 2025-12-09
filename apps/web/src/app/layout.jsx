import { Geist, Geist_Mono, Rajdhani } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "../components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "SidMail - Personal Email Client",
  description: "A personal email client for my personal email needs",
  keywords: ["email", "IMAP", "SMTP", "email client", "mail server"],
  authors: [{ name: "SidMail" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#0066FF",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body 
        className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}

