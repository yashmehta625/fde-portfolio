import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yash Mehta — Forward Deployed Engineer Portfolio",
  description:
    "Interactive demos of problems a Forward Deployed Engineer solves in the field: schema inference, entity resolution, backpressure, and data reconciliation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <header className="border-b border-neutral-800">
          <nav className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
            <Link href="/" className="font-semibold tracking-tight">
              Yash Mehta <span className="text-neutral-500">/ FDE Portfolio</span>
            </Link>
            <a
              href="https://github.com/yashmehta625/fde-portfolio"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              View source on GitHub ↗
            </a>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-neutral-800">
          <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-neutral-500">
            Built to demonstrate the kind of problems Forward Deployed Engineers
            solve day to day — every demo on this site runs a real algorithm,
            in your browser, on whatever input you give it.
          </div>
        </footer>
      </body>
    </html>
  );
}
