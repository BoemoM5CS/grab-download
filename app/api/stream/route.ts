import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url      = searchParams.get('url')
  const filename = searchParams.get('filename') || 'video.mp4'

  if (!url) return new Response('No URL', { status: 400 })

  try {
    // NOTE: URLSearchParams.get() already URL-decodes the value once.
    // Calling decodeURIComponent() again here corrupts any tunnel URL whose
    // signed query string contains a literal `%` sequence (e.g. %2B, %3D),
    // which is common for Cobalt's signed tunnel links.
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36',
        'Accept':     '*/*',
      },
    })

    if (!upstream.ok) {
      return new Response(`Stream failed: ${upstream.status}`, { status: upstream.status })
    }

    const headers = new Headers()
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    headers.set('Content-Type', upstream.headers.get('content-type') || 'video/mp4')
    headers.set('Cache-Control', 'no-store')

    const contentLength = upstream.headers.get('content-length')
    if (contentLength) headers.set('Content-Length', contentLength)

    return new Response(upstream.body, { headers })

  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 60
