import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Generate or retrieve a persistent session ID for tracking gameplay sessions
let sessionId = ''
if (typeof window !== 'undefined') {
  sessionId = localStorage.getItem('phonics_session_id') || ''
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now()
    localStorage.setItem('phonics_session_id', sessionId)
  }
}

// Initialize Supabase client if keys are provided
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export async function logEvent(
  eventType: string,
  wave: number,
  level: any,
  details: Record<string, any> = {}
) {
  const logData = {
    session_id: sessionId,
    event_type: eventType,
    wave,
    level: typeof level === 'object' ? JSON.stringify(level) : String(level),
    details,
    client_time: new Date().toISOString()
  }

  // Always output to developer console
  console.log(`[Supabase Log] ${eventType} (Wave ${wave}):`, logData)

  if (supabase) {
    try {
      const { error } = await supabase.from('phonics_defend_logs').insert([logData])
      if (error) {
        console.error('Supabase insert error:', error)
      }
    } catch (e) {
      console.error('Supabase logging failed:', e)
    }
  } else {
    // Save to local storage queue for inspection/fallback
    if (typeof window !== 'undefined') {
      try {
        const localLogs = JSON.parse(localStorage.getItem('phonics_local_logs') || '[]')
        localLogs.push(logData)
        if (localLogs.length > 200) localLogs.shift() // keep last 200 logs
        localStorage.setItem('phonics_local_logs', JSON.stringify(localLogs))
      } catch (err) {}
    }
  }
}
