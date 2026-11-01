import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ingest-os.vercel.app"),
  title: {
    default: "IngestOS - Zero-Retention Data Ingestion & Quarantine Platform",
    template: "%s | IngestOS",
  },
  description:
    "Turn dirty CSV & JSON streams into clean, validated PostgreSQL data in seconds. Vectorized Polars Rust AST engine with human-in-the-loop quarantine triage and strict zero-retention memory compliance.",
  keywords: [
    "data ingestion",
    "quarantine studio",
    "ETL triage",
    "Polars Rust",
    "zero retention",
    "GDPR Article 17",
    "India DPDP",
    "PostgreSQL stream",
    "HMAC-SHA256 webhooks",
  ],
  authors: [{ name: "IngestOS Core Team" }],
  creator: "IngestOS",
  publisher: "IngestOS",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ingest-os.vercel.app",
    siteName: "IngestOS",
    title: "IngestOS — Zero-Retention Data Ingestion & Quarantine Platform",
    description:
      "Turn dirty CSV & JSON streams into clean, validated PostgreSQL data in seconds. Vectorized Polars Rust AST engine with human-in-the-loop quarantine triage and strict zero-retention memory compliance.",
  },
  twitter: {
    card: "summary_large_image",
    title: "IngestOS — Zero-Retention Data Ingestion & Quarantine Platform",
    description:
      "Turn dirty CSV & JSON streams into clean, validated PostgreSQL data in seconds. Vectorized Polars Rust AST engine with human-in-the-loop quarantine triage and strict zero-retention memory compliance.",
    creator: "@ingestos",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-canvas text-slate-100 min-h-screen antialiased flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
        <AuthProvider>
          <Navbar />
          {children}
          <Toaster richColors position="bottom-right" theme="dark" />
        </AuthProvider>
      </body>
    </html>
  );
}
