import type { Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { cookies } from "next/headers"

import "@workspace/ui/globals.css"
import { ThemeProviderWrapper } from "@/components/theme-provider"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { cn } from "@workspace/ui/lib/utils";

export const viewport: Viewport = {
  themeColor: "#00834b",
}

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const lang = cookieStore.get("lang")?.value === "en" ? "en" : "bn"

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-dvh overflow-x-hidden">
        <ServiceWorkerRegister />
        <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
      </body>
    </html>
  )
}
