import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://qtggizsznmlfpwdwssom.supabase.co'
const supabaseKey = 'sb_publishable_lI0uK_m9B484dNVyBTMAbA_5nPCffsR'

export const supabase = createClient(supabaseUrl, supabaseKey)