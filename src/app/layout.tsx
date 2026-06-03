import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import SpaRedirect from '@/components/shared/SpaRedirect'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '900'],
})

export const metadata: Metadata = {
  title: 'محور — إدارة المشاريع',
  description: 'منصة إدارة المشاريع التقنية الشخصية',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-sans">
        <SpaRedirect />
        {children}
      </body>
    </html>
  )
}
