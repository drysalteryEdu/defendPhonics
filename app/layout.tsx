import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '拼读保卫战',
  description: '自然拼读塔防游戏原型',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="bg-sky-50 min-h-screen">{children}</body>
    </html>
  )
}
