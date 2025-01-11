import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { LayoutWrapper } from "@/components/layout-wrapper"
import Navbar from "@/components/navbar"
import { PageTransition } from '@/components/page-transition'
import { FirebaseProvider } from '@/contexts/firebase-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'IoT Monitor',
  description: 'Monitor your IoT devices and sensors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <LayoutWrapper>
            <PageTransition>
              <FirebaseProvider>
                <main className="container mx-auto px-4 py-8">
                  {children}
                </main>
              </FirebaseProvider>
            </PageTransition>
          </LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}

