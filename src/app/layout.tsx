import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Urut — Find a massage therapist near you",
  description: "Match with trusted massage therapists across Malaysia. Urut tradisional, bersalin, refleksologi and more.",
  applicationName: "Urut",
  appleWebApp: { capable: true, title: "Urut", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1f6560",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-sand-50 shadow-[0_0_40px_rgba(0,0,0,0.06)]">
          <main className="flex-1 pb-24">{children}</main>
          <Suspense fallback={<div className="fixed inset-x-0 bottom-0 mx-auto h-[60px] max-w-md border-t border-sand-200 bg-white" />}>
            <BottomNav />
          </Suspense>
        </div>
      </body>
    </html>
  );
}
