'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────────
type Status = 'idle' | 'loading' | 'success' | 'error'

interface HistoryItem {
  id:         string
  url:        string
  filename:   string
  platform:   string
  created_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPlatform(url: string): string {
  try {
    const h = new URL(url).hostname
    if (h.includes('youtube') || h.includes('youtu.be')) return 'YouTube'
    if (h.includes('tiktok'))    return 'TikTok'
    if (h.includes('twitter') || h.includes('x.com')) return 'Twitter/X'
    if (h.includes('instagram')) return 'Instagram'
    if (h.includes('reddit'))    return 'Reddit'
    if (h.includes('vimeo'))     return 'Vimeo'
    return 'Video'
  } catch { return 'Video' }
}

const PLATFORMS = ['YouTube','TikTok','Twitter/X','Instagram','Reddit','Vimeo','Pinterest','SoundCloud']

const QUALITIES = [
  { label: 'Max',   value: 'max'  },
  { label: '1080p', value: '1080' },
  { label: '720p',  value: '720'  },
  { label: '480p',  value: '480'  },
  { label: '4K',    value: '2160' },
]

const MODES = [
  { label: '🎬 Video',  value: 'auto'  },
  { label: '🎵 Audio',  value: 'audio' },
]

// ── Select Component ───────────────────────────────────────────────────────────
function Select({ label, options, value, onChange }: {
  label: string
  options: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold tracking-[2px] text-[#555] uppercase">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8FF00] transition-colors appearance-none cursor-pointer"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23555' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-[#161616]">{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [url,      setUrl]      = useState('')
  const [quality,  setQuality]  = useState('1080')
  const [mode,     setMode]     = useState('auto')
  const [status,   setStatus]   = useState<Status>('idle')
  const [message,  setMessage]  = useState('')
  const [progress, setProgress] = useState(0)
  const [history,  setHistory]  = useState<HistoryItem[]>([])
  const [tab,      setTab]      = useState<'download'|'history'>('download')
  const [cobaltConfigured, setCobaltConfigured] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load history from Supabase, and check backend config, on mount
  useEffect(() => {
    loadHistory()
    fetch('/api/config')
      .then(r => r.json())
      .then(d => setCobaltConfigured(Boolean(d.cobaltConfigured)))
      .catch(() => setCobaltConfigured(false))
  }, [])

  async function loadHistory() {
    try {
      const { data } = await supabase
        .from('downloads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30)
      if (data) setHistory(data)
    } catch { /* Supabase not configured yet */ }
  }

  async function saveToHistory(downloadUrl: string, filename: string) {
    try {
      await supabase.from('downloads').insert({
        url:      downloadUrl,
        filename,
        platform: getPlatform(downloadUrl),
      })
      loadHistory()
    } catch { /* silent */ }
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
      inputRef.current?.focus()
    } catch {
      inputRef.current?.focus()
    }
  }

  async function handleDownload() {
    if (!url.trim()) { setStatus('error'); setMessage('Paste a video URL first.'); return }

    setStatus('loading')
    setMessage('Getting download link...')
    setProgress(20)

    try {
      const res  = await fetch('/api/download', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          url:               url.trim(),
          videoQuality:      quality,
          youtubeVideoCodec: 'h264',
          downloadMode:      mode,
        }),
      })

      const data = await res.json()
      setProgress(60)

      if (!res.ok || data.error) {
        setStatus('error')
        setMessage(data.error || 'Something went wrong.')
        return
      }

      if (data.status === 'error') {
        const code = (data.error?.code || 'unknown').replace('error.api.','').replace('error.','').replace(/_/g,' ')
        setStatus('error')
        setMessage(`Could not download: ${code}`)
        return
      }

      if (data.status === 'tunnel' || data.status === 'redirect') {
        setProgress(80)
        setMessage('Starting download...')
        triggerDownload(data.streamUrl, data.filename)
        await saveToHistory(url.trim(), data.filename || 'video.mp4')
        setProgress(100)
        setStatus('success')
        setMessage(`✓ Downloading: ${data.filename || 'video'}`)
      } else if (data.status === 'picker') {
        const first = data.picker[0]
        triggerDownload(first.streamUrl, first.filename)
        await saveToHistory(url.trim(), first.filename || 'video.mp4')
        setProgress(100)
        setStatus('success')
        setMessage(`✓ Downloading ${data.picker.length} files — first one started`)
      }

    } catch (err: any) {
      setStatus('error')
      setMessage(`Network error: ${err.message}`)
    }
  }

  function triggerDownload(streamUrl: string, filename: string) {
    const a = document.createElement('a')
    a.href     = streamUrl
    a.download = filename || 'video.mp4'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function reset() {
    setStatus('idle')
    setMessage('')
    setProgress(0)
    setUrl('')
  }

  async function deleteHistory(id: string) {
    try {
      await supabase.from('downloads').delete().eq('id', id)
      setHistory(h => h.filter(i => i.id !== id))
    } catch { setHistory(h => h.filter(i => i.id !== id)) }
  }

  async function clearAllHistory() {
    try {
      await supabase.from('downloads').delete().neq('id', '0')
      setHistory([])
    } catch { setHistory([]) }
  }

  const isLoading = status === 'loading'

  return (
    <main className="min-h-screen max-w-lg mx-auto px-4 pb-24">

      {/* ── Header ── */}
      <div className="text-center pt-12 pb-6">
        <h1 className="text-7xl font-black tracking-tighter leading-none">
          <span className="text-[#C8FF00]">G</span>
          <span className="text-white">R</span>
          <span className="text-[#FF4D6D]">A</span>
          <span className="text-[#00D4FF]">B</span>
        </h1>
        <p className="text-[10px] font-bold tracking-[4px] text-[#444] uppercase mt-2">
          Video Downloader · No Ads
        </p>
      </div>

      {/* ── Config status banner ── */}
      {(cobaltConfigured === false || !isSupabaseConfigured) && (
        <div className="bg-[#FF4D6D08] border border-[#FF4D6D30] text-[#FF4D6D] rounded-xl p-4 text-xs leading-relaxed mb-5 space-y-1">
          <p className="font-bold tracking-wide uppercase text-[11px]">Setup incomplete</p>
          {cobaltConfigured === false && <p>• COBALT_INSTANCE is not set — downloads won't work until it's added in Vercel env vars.</p>}
          {!isSupabaseConfigured && <p>• Supabase URL/key not set — history won't be saved.</p>}
        </div>
      )}

      {/* ── Platform chips ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {PLATFORMS.map(p => (
          <span key={p} className="flex-shrink-0 text-[10px] font-bold tracking-wider text-[#444] uppercase border border-[#1e1e1e] rounded px-2.5 py-1 bg-[#111]">
            {p}
          </span>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-[#111] border border-[#222] rounded-xl p-1 mb-5">
        {(['download','history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold tracking-wider uppercase transition-all ${
              tab === t
                ? 'bg-[#C8FF00] text-black'
                : 'text-[#555] hover:text-white'
            }`}
          >
            {t === 'download' ? '⬇ Download' : `📋 History ${history.length > 0 ? `(${history.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* ── Download Tab ── */}
      {tab === 'download' && (
        <div className="space-y-4">

          {/* URL input card */}
          <div className="bg-[#161616] border border-[#222] rounded-2xl overflow-hidden">
            {/* accent bar */}
            <div className="h-[3px] bg-gradient-to-r from-[#C8FF00] via-[#00D4FF] to-[#FF4D6D]" />

            <div className="p-5 space-y-4">
              <label className="text-[10px] font-bold tracking-[2.5px] text-[#555] uppercase">Video URL</label>

              {/* Input row */}
              <div className="flex border border-[#222] rounded-xl overflow-hidden bg-[#111] focus-within:border-[#C8FF00] transition-colors">
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDownload()}
                  placeholder="Paste link here..."
                  className="flex-1 bg-transparent px-4 py-4 text-sm text-white placeholder-[#333] outline-none font-mono"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <button
                  onClick={handlePaste}
                  className="px-4 bg-[#1a1a1a] border-l border-[#222] text-[#C8FF00] text-xs font-black tracking-widest hover:bg-[#C8FF00] hover:text-black transition-all active:scale-95"
                >
                  PASTE
                </button>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                <Select label="Quality" options={QUALITIES} value={quality} onChange={setQuality} />
                <Select label="Mode"    options={MODES}     value={mode}    onChange={setMode}    />
              </div>

              {/* Download button */}
              <button
                onClick={handleDownload}
                disabled={isLoading}
                className={`w-full py-5 rounded-xl font-black text-lg tracking-[4px] uppercase transition-all active:scale-[0.98] ${
                  isLoading
                    ? 'bg-[#222] text-[#444] cursor-not-allowed'
                    : 'bg-[#C8FF00] text-black hover:bg-[#d4ff33] shadow-[0_0_30px_rgba(200,255,0,0.2)]'
                }`}
              >
                {isLoading ? '...' : '⬇ DOWNLOAD'}
              </button>

              {/* Progress bar */}
              {isLoading && (
                <div className="h-1 bg-[#222] rounded-full overflow-hidden">
                  <div
                    className="h-full progress-bar rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {/* Status message */}
              {status !== 'idle' && (
                <div className={`flex items-start gap-3 p-4 rounded-xl text-sm border ${
                  status === 'success' ? 'bg-[#00E67608] border-[#00E67630] text-[#00E676]' :
                  status === 'error'   ? 'bg-[#FF4D6D08] border-[#FF4D6D30] text-[#FF4D6D]' :
                  'bg-[#C8FF0008] border-[#C8FF0030] text-[#C8FF00]'
                }`}>
                  <span className="mt-0.5 flex-shrink-0">
                    {status === 'success' ? '✓' : status === 'error' ? '✗' : '⟳'}
                  </span>
                  <span className="flex-1 leading-relaxed">{message}</span>
                  {(status === 'success' || status === 'error') && (
                    <button onClick={reset} className="text-[#444] hover:text-white text-xs font-bold tracking-wider ml-2 flex-shrink-0">
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info note */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 text-xs text-[#444] leading-relaxed">
            <span className="text-[#FF6B35] font-bold">Your private instance:</span> Downloads go through your own Railway Cobalt server. History saved to Supabase.
          </div>
        </div>
      )}

      {/* ── History Tab ── */}
      {tab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-16 text-[#333]">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm font-medium">No downloads yet</p>
              <p className="text-xs mt-1">Your download history will appear here</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold tracking-[3px] text-[#444] uppercase">{history.length} downloads</span>
                <button onClick={clearAllHistory} className="text-xs text-[#444] hover:text-[#FF4D6D] underline transition-colors">
                  Clear all
                </button>
              </div>

              {history.map(item => (
                <div key={item.id} className="bg-[#161616] border border-[#222] rounded-xl p-4 flex gap-3 items-center group active:scale-[0.99] transition-transform">
                  <div className="w-10 h-10 rounded-lg bg-[#111] border border-[#222] flex items-center justify-center text-lg flex-shrink-0">
                    📹
                  </div>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => { setUrl(item.url); setTab('download'); setStatus('idle') }}
                  >
                    <p className="text-sm font-medium text-white truncate">{item.filename}</p>
                    <p className="text-[11px] text-[#444] truncate mt-0.5">{item.platform} · {new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => deleteHistory(item.id)}
                    className="text-[#333] hover:text-[#FF4D6D] transition-colors opacity-0 group-hover:opacity-100 text-lg flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Bottom nav ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#080808]/90 backdrop-blur-xl border-t border-[#1a1a1a] px-4 py-3 flex justify-center">
        <p className="text-[10px] text-[#2a2a2a] tracking-widest uppercase">
          Powered by Cobalt · Personal use only
        </p>
      </div>

    </main>
  )
}
