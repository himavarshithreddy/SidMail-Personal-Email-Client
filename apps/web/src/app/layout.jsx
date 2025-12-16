import { Geist, Geist_Mono, Rajdhani } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "../components/ErrorBoundary";
import InstallPrompt from "../components/InstallPrompt";
import OfflineIndicator from "../components/OfflineIndicator";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";

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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SidMail",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "SidMail",
    title: "SidMail - Personal Email Client",
    description: "A personal email client for managing your emails efficiently",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [
      { url: "/favicon.ico" }
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#25bcd0",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <ServiceWorkerRegistration />
          <InstallPrompt />
          <OfflineIndicator />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

