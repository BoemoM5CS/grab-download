import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title:       'GRAB — Video Downloader',
  description: 'Download videos from YouTube, TikTok, Instagram, Twitter and more. No ads.',
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:          true,
    statusBarStyle:   'black-translucent',
    title:            'GRAB',
  },
  icons: {
    icon:  '/icon.png',
    apple: '/icon.png',
  },
}

export const viewport: Viewport = {
  themeColor:          '#080808',
  width:               'device-width',
  initialScale:        1,
  maximumScale:        1,
  userScalable:        false,
  viewportFit:         'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
