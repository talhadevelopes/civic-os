// app/layout.tsx
import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ReactQueryProvider } from "./providers"
import "./globals.css"
import { Navbar } from "./_components/navbar"

const geist = Geist({ 
  subsets: ["latin"],
  variable: "--font-geist"
})
const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-geist-mono"
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
          <ReactQueryProvider>
            <Navbar />
            {children}
          </ReactQueryProvider>
        </NextThemesProvider>
      </body>
    </html>
  )
}