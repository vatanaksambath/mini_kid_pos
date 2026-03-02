'use server'

import { supabase } from '@/lib/supabase'

export async function getVariantBySKU(sku: string) {
  try {
    // Fetch variant and colors IN PARALLEL — eliminates one sequential roundtrip
    const [variantResult, colorsResult] = await Promise.all([
      supabase.from('ProductVariant').select(`
        *,
        product:Product(*),
        size:Size(*),
        inventory:InventoryLevel(
          *,
          location:StoreLocation(*)
        )
      `).eq('sku', sku).single(),
      supabase.from('Color').select('*')
    ])

    if (variantResult.error || !variantResult.data) {
      return { success: false, error: 'Product not found' }
    }

    const colorMap = new Map(colorsResult.data?.map(c => [c.hex.toLowerCase(), c.name]) || [])

    const serializedVariant = {
      ...variantResult.data,
      basePrice: Number(variantResult.data.basePrice),
      priceOverride: variantResult.data.priceOverride ? Number(variantResult.data.priceOverride) : null,
      colorName: colorMap.get(variantResult.data.color?.toLowerCase()) || variantResult.data.color
    }

    return { success: true, data: serializedVariant }
  } catch (error) {
    console.error('Error fetching variant by SKU:', error)
    return { success: false, error: 'Database error' }
  }
}
