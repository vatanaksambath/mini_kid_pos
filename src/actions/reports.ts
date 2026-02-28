'use server'

import { supabase } from '@/lib/supabase'
import { unstable_noStore as noStore } from 'next/cache'

export async function getSalesReport(startDate?: string, endDate?: string) {
  noStore()
  try {
    let query = supabase
      .from('Order')
      .select(`
        id,
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
  noStore()
  try {
    const { data, error } = await supabase
      .from('OrderLineItem')
      .select(`
        quantity,
        variant:ProductVariant(
          product:Product(name)
        )
      `)
      .limit(2000) // Rough scan

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
