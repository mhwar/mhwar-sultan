import type { Metadata } from 'next'
import { Cairo, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import SpaRedirect from '@/components/shared/SpaRedirect'
import StoreHydration from '@/components/shared/StoreHydration'
import IdentityGate from '@/components/shared/IdentityGate'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '900'],
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'بوصلة الأعمال',
  description: 'منصة بوصلة الأعمال — حلول أعمال متكاملة، إدارة حسابات التواصل الاجتماعي وصناعة المحتوى',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" data-theme="dark" className={`${cairo.variable} ${jetbrains.variable}`}>
      <body className="font-sans">
        <SpaRedirect />
        <StoreHydration />
        <IdentityGate>{children}</IdentityGate>
      </body>
    </html>
  )
}
