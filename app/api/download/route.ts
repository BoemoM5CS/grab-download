import { NextRequest, NextResponse } from 'next/server'

const COBALT = (process.env.COBALT_INSTANCE || '').replace(/\/$/, '')

export async function POST(req: NextRequest) {
  if (!COBALT) {
    return NextResponse.json({ error: 'COBALT_INSTANCE not configured.' }, { status: 503 })
  }

  const body = await req.json()
  const { url, videoQuality, youtubeVideoCodec, downloadMode } = body

  if (!url) return NextResponse.json({ error: 'No URL provided.' }, { status: 400 })

  try {
    const res = await fetch(`${COBALT}/`, {
      method: 'POST',
      headers: {
        'Accept':       'application/json',
        'Content-Type': 'application/json',
        'User-Agent':   'GRAB/1.0',
      },
      body: JSON.stringify({
        url,
        videoQuality:      videoQuality      || '1080',
        youtubeVideoCodec: youtubeVideoCodec || 'h264',
        filenameStyle:     'pretty',
        downloadMode:      downloadMode      || 'auto',
      }),
    })

    const data = await res.json()

    // Wrap tunnel/redirect URLs through our stream proxy
    if (data.status === 'tunnel' || data.status === 'redirect') {
      return NextResponse.json({
        ...data,
        streamUrl: `/api/stream?url=${encodeURIComponent(data.url)}&filename=${encodeURIComponent(data.filename || 'video.mp4')}`,
      })
    }

    if (data.status === 'picker') {
      const items = data.picker.map((item: any) => ({
        ...item,
        streamUrl: `/api/stream?url=${encodeURIComponent(item.url)}&filename=${encodeURIComponent(item.filename || 'video.mp4')}`,
      }))
      return NextResponse.json({ ...data, picker: items })
    }

    return NextResponse.json(data)

  } catch (err: any) {
    return NextResponse.json({ error: `Cobalt error: ${err.message}` }, { status: 500 })
  }
}
