import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTimestamp() {
  const { data, error } = await supabase
    .from('Order')
    .select('orderNumber, createdAt')
    .order('createdAt', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('Order Number:', data[0].orderNumber)
    console.log('Raw createdAt:', data[0].createdAt)
    console.log('Date object string:', new Date(data[0].createdAt).toString())
    console.log('toLocaleString:', new Date(data[0].createdAt).toLocaleString())
  } else {
    console.log('No orders found.')
  }
}

checkTimestamp()
