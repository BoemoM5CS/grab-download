import { NextResponse } from 'next/server'

// Lightweight status check the client can poll on load. Reports whether
// required env vars are present — never the values themselves.
export async function GET() {
  return NextResponse.json({
    cobaltConfigured: Boolean(process.env.COBALT_INSTANCE),
  })
}

export const dynamic = 'force-dynamic'
