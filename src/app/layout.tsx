import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kograph APIs — Resep Nusantara',
  description: 'API resep makanan dan minuman tradisional Indonesia dari Sabang sampai Merauke.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
