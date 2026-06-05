import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AlloStock — Inventory Reservation System",
  description:
    "Production-grade inventory reservation system for ecommerce checkout. Reserve stock safely under concurrency.",
  keywords: ["inventory", "reservation", "ecommerce", "stock management"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <QueryProvider>
          <div className="min-h-screen bg-[#0a0a0f]">
            <Navbar />
            <main className="pt-16">{children}</main>
          </div>
          <Toaster
            position="top-right"
            richColors
            closeButton
            theme="dark"
          />
        </QueryProvider>
      </body>
    </html>
  );
}
