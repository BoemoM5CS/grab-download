import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

// Fall back to harmless placeholder values when env vars are missing so
// createClient() never throws during build/prerender. Real calls made
// against these placeholders will fail at request time (caught by callers),
// not crash `next build`.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-anon-key'
)

export type HistoryItem = {
  id:         string
  url:        string
  filename:   string
  platform:   string
  created_at: string
}
