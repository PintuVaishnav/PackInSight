import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "PackInsight - Package Security Scanner",
  description: "Scan npm, Python, and Docker packages for security vulnerabilities",
  icons: "/favicon.png",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider defaultTheme="system" storageKey="packinsight-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}