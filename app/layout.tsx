import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Suspense } from "react";
import { headers } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { NavbarWrapper } from "@/components/navbar-wrapper";
import { StyleProvider } from "@/components/style-provider";
import { MandrillConnect } from "@/components/mandrill-connect";
import { ShowWhenConnected } from "@/components/show";

const dmSans = DM_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mandrill Template Manager",
  description: "A management panel for Mandrill email templates",
  icons: {
    icon: '/icon.svg',
  },
};

export default async function RootLayout({
  children,
  entity,
  structure,
}: Readonly<{
  children: React.ReactNode;
  entity: React.ReactNode;
  structure: React.ReactNode;
}>) {
  // Access request data first to satisfy Next.js 16 prerendering requirements
  await headers();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title></title>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                const storedTheme = localStorage.getItem('theme');
                if (storedTheme) {
                  document.documentElement.classList.toggle('dark', storedTheme === 'dark');
                } else {
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.classList.toggle('dark', systemPrefersDark);
                }
              } catch (e) {
                console.error('Error setting initial theme:', e);
              }
            })();
          `
        }} />
      </head>
      <body
        className={`${dmSans.variable} antialiased min-h-screen`}
      >
        <ThemeProvider>
          <StyleProvider />
          <div className="flex flex-col min-h-screen">
            <Suspense fallback={<div className="h-16 border-b border-border"></div>}>
              <NavbarWrapper />
            </Suspense>
            <main className="flex-1">
              <ShowWhenConnected
                fallback={<MandrillConnect />}
              >
                <div className="flex flex-col gap-4">
                  {children}
                  {structure}
                  {entity}
                </div>
              </ShowWhenConnected>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
