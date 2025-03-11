import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Navigation } from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Organ Marketplace",
  description: "A marketplace for organ listings with bidding functionality",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        <main className="flex min-h-screen flex-col items-center p-6 md:p-12">
        {children}
        </main>
      </body>
    </html>
  )
}



import './globals.css'