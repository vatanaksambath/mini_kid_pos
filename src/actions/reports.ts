'use server'

import { supabase } from '@/lib/supabase'

export async function getSalesReport(startDate?: string, endDate?: string) {
  try {
    let query = supabase
      .from('Order')
      .select(`
        id,
        orderNumber,
        totalAmount,
        discountAmount,
        shippingFee,
        createdAt,
        status,
        items:OrderLineItem(
          quantity,
          price,
          costPrice,
          variant:ProductVariant(
            product:Product(name, category:Category(name), brand:Brand(name))
          )
        )
      `)
      .neq('status', 'CANCELLED')

    if (startDate) {
      query = query.gte('createdAt', startDate)
    }
    if (endDate) {
      query = query.lte('createdAt', endDate + 'T23:59:59')
    }

    const { data, error } = await query.order('createdAt', { ascending: true })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error('Error fetching sales report:', error)
    return { success: false, error: error.message }
  }
}

export async function getTopSellingProducts(limit = 10) {
  try {
    // Use server-side aggregation via Supabase RPC for efficiency.
    // Falls back to client-side grouping if the function isn't set up yet.
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_top_selling_products', { p_limit: limit })
    
    if (!rpcError && rpcData) {
      return { success: true, data: rpcData }
    }

    // Fallback: fetch with aggregate grouping —  still much better than 2000-row scan
    // Limit to recent 500 orders to reduce data transfer
    const { data, error } = await supabase
      .from('OrderLineItem')
      .select(`
        quantity,
        variant:ProductVariant(
          product:Product(name)
        )
      `)
      .limit(500)

    if (error) throw error

    // Group by product name
    const grouped: Record<string, number> = {}
    data?.forEach((item: any) => {
      const name = item.variant?.product?.name || 'Unknown'
      grouped[name] = (grouped[name] || 0) + item.quantity
    })

    const result = Object.entries(grouped)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit)

    return { success: true, data: result }
  } catch (error: any) {
    console.error('Error fetching top products:', error)
    return { success: false, error: error.message }
  }
}
