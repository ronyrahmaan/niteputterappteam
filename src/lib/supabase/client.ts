import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = 'https://hjgtvqhdzfifranfhepp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3R2cWhkemZpZnJhbmZoZXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzkzNDUsImV4cCI6MjA3NjY1NTM0NX0.4COZSwwBtMAnvCMUFBMUEKgowCUeifgBCttY-wzP0Mo'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Admin client for server-side operations (use carefully)
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3R2cWhkemZpZnJhbmZoZXBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA3OTM0NSwiZXhwIjoyMDc2NjU1MzQ1fQ.Re52eQWQg8R6INAoorf_2RRwy4SIcRKuXvmARNWa7mQ'

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})