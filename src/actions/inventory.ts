'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function getProducts() {
  try {
    const { data: products, error } = await supabase
      .from('Product')
      .select(`
        *,
        variants:ProductVariant(
          *,
          size:Size(*),
          inventory:InventoryLevel(*)
        ),
        category:Category(*),
        brand:Brand(*)
      `)
      .order('updatedAt', { ascending: false })

    if (error) throw error

    // Convert string decimals to numbers for serialization if necessary
    const serializedProducts = (products || []).map((product: any) => ({
      ...product,
      variants: (product.variants || []).map((variant: any) => ({
        ...variant,
        basePrice: Number(variant.basePrice),
        priceOverride: variant.priceOverride ? Number(variant.priceOverride) : null,
      }))
    }))

    return { success: true, data: serializedProducts }
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch products' 
    }
  }
}

export async function getProductById(id: string) {
  try {
    const { data: product, error } = await supabase
      .from('Product')
      .select(`
        *,
        category:Category(*),
        brand:Brand(*),
        variants:ProductVariant(
          *,
          size:Size(*),
          inventory:InventoryLevel(
            *,
            location:StoreLocation(*)
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !product) return { success: false, error: 'Product not found' }

    const serializedProduct = {
      ...product,
      variants: (product.variants || []).map((variant: any) => ({
        ...variant,
        basePrice: Number(variant.basePrice),
        priceOverride: variant.priceOverride ? Number(variant.priceOverride) : null,
      }))
    }

    return { success: true, data: serializedProduct }
  } catch (error) {
    console.error('Error fetching product:', error)
    return { success: false, error: 'Failed to fetch product' }
  }
}

export async function createProduct(data: {
  name: string
  description?: string
  categoryId?: string
  brandId?: string
  imageUrl?: string
  stockDate?: string
  variants: {
    sku: string
    sizeId?: string
    color?: string
    priceOverride?: number
    basePrice: number
    quantity: number
  }[]
}) {
  try {
    // 1. Create the base product
    const { data: newProduct, error: productError } = await supabase
      .from('Product')
      .insert({
        name: data.name,
        description: data.description || null,
        categoryId: data.categoryId || null,
        brandId: data.brandId || null,
        imageUrl: data.imageUrl || null,
        stockDate: data.stockDate || null,
      })
      .select()
      .single()

    if (productError || !newProduct) throw productError

    // 2. Default Location
    let { data: defaultLocation } = await supabase
      .from('StoreLocation')
      .select('*')
      .eq('name', 'Main Store')
      .single()

    if (!defaultLocation) {
      const { data: loc } = await supabase
        .from('StoreLocation')
        .insert({ name: 'Main Store', address: 'Default Address' })
        .select()
        .single()
      defaultLocation = loc
    }

    // 3. Create variants and initial inventory
    for (let variant of data.variants) {
      let sku = variant.sku?.trim()
      if (!sku) {
        const { count } = await supabase.from('ProductVariant').select('*', { count: 'exact', head: true })
        sku = `SKU-${String((count || 0) + 1).padStart(5, '0')}`
      }

      const { data: newVariant, error: varError } = await supabase
        .from('ProductVariant')
        .insert({
          productId: newProduct.id,
          sku,
          sizeId: variant.sizeId || null,
          color: variant.color || null,
          priceOverride: variant.priceOverride || null,
          basePrice: variant.basePrice,
        })
        .select()
        .single()

      if (varError || !newVariant) throw varError

      await supabase.from('InventoryLevel').insert({
        variantId: newVariant.id,
        locationId: defaultLocation.id,
        quantity: variant.quantity,
      })
    }

    revalidatePath('/')
    return { success: true, data: newProduct }
  } catch (error) {
    console.error('Error creating product:', error)
    return { success: false, error: 'Failed to create product' }
  }
}

export async function deleteProduct(id: string) {
  try {
    // 1. Get variant IDs
    const { data: variants } = await supabase
      .from('ProductVariant')
      .select('id')
      .eq('productId', id)

    const variantIds = variants ? variants.map(v => v.id) : []

    // 2. Delete Inventory Levels and Variants
    if (variantIds.length > 0) {
      await supabase.from('InventoryLevel').delete().in('variantId', variantIds)
      await supabase.from('ProductVariant').delete().in('id', variantIds) // Also can delete by productId directly
    }

    // 3. Delete Product
    const { error } = await supabase.from('Product').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error deleting product:', error)
    return { success: false, error: 'Failed to delete product. It might have orders.' }
  }
}

export async function updateProduct(id: string, data: {
  name: string
  description?: string
  categoryId?: string
  brandId?: string
  imageUrl?: string
  stockDate?: string
  variants: {
    id?: string
    sku: string
    sizeId?: string
    color?: string
    priceOverride?: number
    basePrice: number
    quantity: number
  }[]
}) {
  try {
    // 1. Update the base product
    const { data: product, error: productError } = await supabase
      .from('Product')
      .update({
        name: data.name,
        description: data.description || null,
        categoryId: data.categoryId || null,
        brandId: data.brandId || null,
        imageUrl: data.imageUrl || null,
        stockDate: data.stockDate || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (productError || !product) throw productError

    // 2. Handle Variants (Syncing)
    const { data: existingVariants } = await supabase
      .from('ProductVariant')
      .select('id')
      .eq('productId', id)

    const existingVariantIds = existingVariants ? existingVariants.map(v => v.id) : []
    const incomingVariantIds = data.variants.map(v => v.id).filter(Boolean) as string[]

    // Delete removed variants
    const toDelete = existingVariantIds.filter(vId => !incomingVariantIds.includes(vId))
    if (toDelete.length > 0) {
      await supabase.from('InventoryLevel').delete().in('variantId', toDelete)
      await supabase.from('ProductVariant').delete().in('id', toDelete)
    }

    // Load Default Store Location
    let { data: defaultLocation } = await supabase
      .from('StoreLocation')
      .select('*')
      .eq('name', 'Main Store')
      .single()

    if (!defaultLocation) {
      const { data: loc } = await supabase
        .from('StoreLocation')
        .insert({ name: 'Main Store', address: 'Default Address' })
        .select()
        .single()
      defaultLocation = loc
    }

    for (const v of data.variants) {
      if (v.id) {
        // Update existing variant
        await supabase
          .from('ProductVariant')
          .update({
            sku: v.sku?.trim() || `SKU-${Math.random().toString(36).substring(2, 9).toUpperCase()}`, // Fallback if somehow missing
            sizeId: v.sizeId || null,
            color: v.color || null,
            priceOverride: v.priceOverride || null,
            basePrice: v.basePrice,
          })
          .eq('id', v.id)

        // Update quantity
        const { data: inv } = await supabase
          .from('InventoryLevel')
          .select('id')
          .eq('variantId', v.id)
          .eq('locationId', defaultLocation.id)
          .single()

        if (inv) {
          await supabase.from('InventoryLevel').update({ quantity: v.quantity }).eq('id', inv.id)
        } else {
          await supabase.from('InventoryLevel').insert({
            variantId: v.id,
            locationId: defaultLocation.id,
            quantity: v.quantity
          })
        }
      } else {
        // Create new variant
        let sku = v.sku?.trim()
        if (!sku) {
          const { count } = await supabase.from('ProductVariant').select('*', { count: 'exact', head: true })
          sku = `SKU-${String((count || 0) + 1).padStart(5, '0')}`
        }

        const { data: newVariant, error: varError } = await supabase
          .from('ProductVariant')
          .insert({
            productId: id,
            sku,
            sizeId: v.sizeId || null,
            color: v.color || null,
            priceOverride: v.priceOverride || null,
            basePrice: v.basePrice,
          })
          .select()
          .single()

        if (varError || !newVariant) throw varError

        await supabase.from('InventoryLevel').insert({
          variantId: newVariant.id,
          locationId: defaultLocation.id,
          quantity: v.quantity
        })
      }
    }

    revalidatePath('/')
    return { success: true, data: product }
  } catch (error) {
    console.error('------- SUPABASE UPDATE PRODUCT ERROR -------')
    console.dir({ error }, { depth: null })
    console.error('-------------------------------------------')
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update product' }
  }
}

export async function getLocations() {
  try {
    const { data: locations, error } = await supabase.from('StoreLocation').select('*')
    if (error) throw error
    return { success: true, data: locations || [] }
  } catch (error) {
    console.error('Error fetching locations:', error)
    return { success: false, error: 'Failed to fetch low stock variants' }
  }
}

export async function generateUniqueSku() {
  try {
    let unique = false
    let finalSku = ''
    while (!unique) {
      finalSku = `SKU-${Math.floor(100000 + Math.random() * 900000)}`
      const { data, error } = await supabase
        .from('ProductVariant')
        .select('id')
        .eq('sku', finalSku)
        .single()
      
      if (!data) unique = true // No row found, SKU is unique
    }
    return { success: true, sku: finalSku }
  } catch (error) {
    console.error('Error generating SKU:', error)
    return { success: false, error: 'Failed to generate unique SKU' }
  }
}
