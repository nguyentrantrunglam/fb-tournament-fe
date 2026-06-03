import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { AuthProvider } from "@/lib/auth/auth-provider"
import { QueryProvider } from "@/components/query-provider"
import { Toaster } from "sonner"
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
        <Toaster position="bottom-right" theme="dark" richColors />
      </body>
    </html>
  )
}
