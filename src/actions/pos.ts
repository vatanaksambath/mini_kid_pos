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

    const serializedVariant = {
      ...variant,
      basePrice: Number(variant.basePrice),
      priceOverride: variant.priceOverride ? Number(variant.priceOverride) : null,
    }

    return { success: true, data: serializedVariant }
  } catch (error) {
    console.error('Error fetching variant by SKU:', error)
    return { success: false, error: 'Database error' }
  }
}
