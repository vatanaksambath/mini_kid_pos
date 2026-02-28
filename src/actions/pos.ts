'use server'

import { supabase } from '@/lib/supabase'

export async function getVariantBySKU(sku: string) {
  try {
    const { data: variant, error } = await supabase
      .from('ProductVariant')
      .select(`
        *,
        product:Product(*),
        size:Size(*),
        inventory:InventoryLevel(
          *,
          location:StoreLocation(*)
        )
      `)
      .eq('sku', sku)
      .single()
      
    if (error || !variant) {
      return { success: false, error: 'Product not found' }
    }

    // Fetch all colors to map hex to name
    const { data: colors } = await supabase.from('Color').select('*')
    const colorMap = new Map(colors?.map(c => [c.hex.toLowerCase(), c.name]) || [])

    const serializedVariant = {
      ...variant,
      basePrice: Number(variant.basePrice),
      priceOverride: variant.priceOverride ? Number(variant.priceOverride) : null,
      colorName: colorMap.get(variant.color?.toLowerCase()) || variant.color
    }

    return { success: true, data: serializedVariant }
  } catch (error) {
    console.error('Error fetching variant by SKU:', error)
    return { success: false, error: 'Database error' }
  }
}
