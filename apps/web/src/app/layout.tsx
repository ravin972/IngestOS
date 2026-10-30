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
  title: "IngestOS — High-Speed Data Ingestion & Smart Quarantine Studio",
  description:
    "Instantly clean, auto-fix, and validate messy CSV & JSON into production-ready datasets. Zero server-side storage with instant privacy protection.",
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
