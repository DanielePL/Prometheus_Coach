/**
 * Supabase client for the Prometheus Exercise Library
 * This connects to the main Prometheus database (Android app)
 * to access the 810+ exercise library
 */
import { createClient } from '@supabase/supabase-js';

// Prometheus main database (same as Android app)
const PROMETHEUS_SUPABASE_URL = "https://zzluhirmmnkfkifriult.supabase.co";
const PROMETHEUS_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bHVoaXJtbW5rZmtpZnJpdWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzc2MjgsImV4cCI6MjA2NzkxMzYyOH0.gA-8W9Jqaabow6ZqHyoMpKPJjd2ToomNoQIF-CeuG7c";

// Create a separate client for exercise library (read-only access)
export const exerciseLibraryClient = createClient(
  PROMETHEUS_SUPABASE_URL,
  PROMETHEUS_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false, // No auth needed for public exercise library
      autoRefreshToken: false,
    }
  }
);