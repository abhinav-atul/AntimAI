// ============================================================
// AntimAI — Root Layout
// ============================================================

import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/shared/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "AntimAI — Post-Death Administrative Assistant",
  description:
    "Navigate life's hardest paperwork with AI-powered guidance. AntimAI helps Indian families manage post-death legal and financial tasks with step-by-step checklists and auto-generated application letters.",
  keywords: [
    "death administration",
    "legal heir",
    "succession certificate",
    "Indian post-death procedures",
    "claim settlement",
    "insurance claim",
    "bank account closure",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-navy antialiased">
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#f97316",
              colorBackground: "#0a1628",
              colorInputBackground: "#141f38",
              colorInputText: "#f1f5f9",
              colorText: "#f1f5f9",
            },
            elements: {
              card: "border border-white/10 shadow-2xl",
              formButtonPrimary:
                "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
            },
          }}
        >
          <Navbar />
          <main className="pt-16">{children}</main>
        </ClerkProvider>
      </body>
    </html>
  );
}
