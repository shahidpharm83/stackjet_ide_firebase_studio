import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { TerminalProvider } from "@/contexts/terminal-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stackjet IDE",
  description: "An AI-powered coding environment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <TerminalProvider>
          {children}
        </TerminalProvider>
        <Toaster />
      </body>
    </html>
  );
}
