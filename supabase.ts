import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lokhajdmqbjkdoquwyxl.supabase.co'; // À remplacer
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxva2hhamRtcWJqa2RvcXV3eXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1Njc3MzIsImV4cCI6MjA2NTE0MzczMn0.Pm1YUdJk1KUavC3Ok1dZOobLUcHLt778K23qPFY8wu0'; // À remplacer

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
