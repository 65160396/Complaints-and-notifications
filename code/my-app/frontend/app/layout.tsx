import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'

const sarabun = Sarabun({
  variable: '--font-sarabun',
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'IMS — ระบบแจ้งปัญหา',
  description: 'Issue Management System',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-[family-name:var(--font-sarabun)] antialiased bg-gray-50`}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}