'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function getProducts() {
  try {
    // Fetch products and colors IN PARALLEL — eliminates one sequential roundtrip
    const [productsResult, colorsResult] = await Promise.all([
      supabase.from('Product').select(`
        *,
        variants:ProductVariant(
          *,
          size:Size(*),
          inventory:InventoryLevel(*)
        ),
        category:Category(*),
        brand:Brand(*),
        source:ProductSource(*)
      `).order('updatedAt', { ascending: false }),
      supabase.from('Color').select('*')
    ])

    if (productsResult.error) throw productsResult.error

    const colorMap = new Map(colorsResult.data?.map(c => [c.hex.toLowerCase(), c.name]) || [])

    const serializedProducts = (productsResult.data || []).map((product: any) => ({
      ...product,
      variants: (product.variants || []).map((variant: any) => ({
        ...variant,
        basePrice: Number(variant.basePrice),
        costPrice: Number(variant.costPrice),
        colorName: colorMap.get(variant.color?.toLowerCase()) || variant.color
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
    // Fetch product and colors IN PARALLEL
    const [productResult, colorsResult] = await Promise.all([
      supabase.from('Product').select(`
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
        ),
        source:ProductSource(*)
      `).eq('id', id).single(),
      supabase.from('Color').select('*')
    ])

    if (productResult.error || !productResult.data) return { success: false, error: 'Product not found' }

    const colorMap = new Map(colorsResult.data?.map(c => [c.hex.toLowerCase(), c.name]) || [])

    const serializedProduct = {
      ...productResult.data,
      variants: (productResult.data.variants || []).map((variant: any) => ({
        ...variant,
        colorName: colorMap.get(variant.color?.toLowerCase()) || variant.color
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
  sourceId?: string
  imageUrl?: string
  stockDate?: string
  variants: {
    sku: string
    sizeId?: string
    color?: string
    priceOverride?: number
    basePrice: number
    costPrice: number
    quantity: number
  }[]
}) {
  try {
    // 1. Create the base product and get/create the default location IN PARALLEL
    const [productResult, locationResult] = await Promise.all([
      supabase.from('Product').insert({
        name: data.name,
        description: data.description || null,
        categoryId: data.categoryId || null,
        brandId: data.brandId || null,
        sourceId: data.sourceId || null,
        imageUrl: data.imageUrl || null,
        stockDate: data.stockDate || null,
      }).select().single(),
      supabase.from('StoreLocation').select('*').eq('name', 'Main Store').single()
    ])

    if (productResult.error || !productResult.data) throw productResult.error
    const newProduct = productResult.data

    let defaultLocation = locationResult.data
    if (!defaultLocation) {
      const { data: loc } = await supabase
        .from('StoreLocation')
        .insert({ name: 'Main Store', address: 'Default Address' })
        .select().single()
      defaultLocation = loc
    }

    // 2. Batch INSERT all variants in a single query (no loop)
    const variantsToInsert = data.variants.map(variant => ({
      productId: newProduct.id,
      sku: variant.sku?.trim() || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      sizeId: variant.sizeId || null,
      color: variant.color || null,
      priceOverride: variant.priceOverride || null,
      basePrice: variant.basePrice,
      costPrice: variant.costPrice || 0,
    }))

    const { data: newVariants, error: varError } = await supabase
      .from('ProductVariant')
      .insert(variantsToInsert)
      .select()

    if (varError || !newVariants) throw varError

    // 3. Batch INSERT all InventoryLevels in a single query
    const inventoryToInsert = newVariants.map((v, idx) => ({
      variantId: v.id,
      locationId: defaultLocation!.id,
      quantity: data.variants[idx].quantity,
    }))

    await supabase.from('InventoryLevel').insert(inventoryToInsert)

    revalidatePath('/')
    return { success: true, data: newProduct }
  } catch (error) {
    console.error('Error creating product:', error)
    return { success: false, error: 'Failed to create product' }
  }
}

export async function deleteProduct(id: string) {
  try {
    // Get variant IDs and delete everything in parallel chains
    const { data: variants } = await supabase
      .from('ProductVariant')
      .select('id')
      .eq('productId', id)

    const variantIds = variants ? variants.map(v => v.id) : []

    if (variantIds.length > 0) {
      // Delete inventory levels first (FK constraint)
      await supabase.from('InventoryLevel').delete().in('variantId', variantIds)
      await supabase.from('ProductVariant').delete().in('id', variantIds)
    }

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
  sourceId?: string
  imageUrl?: string
  stockDate?: string
  variants: {
    id?: string
    sku: string
    sizeId?: string
    color?: string
    priceOverride?: number
    basePrice: number
    costPrice: number
    quantity: number
  }[]
}) {
  try {
    // 1. Run product update + get existing variants + get location ALL IN PARALLEL
    const [productResult, existingVariantsResult, locationResult] = await Promise.all([
      supabase.from('Product').update({
        name: data.name,
        description: data.description || null,
        categoryId: data.categoryId || null,
        brandId: data.brandId || null,
        sourceId: data.sourceId || null,
        imageUrl: data.imageUrl || null,
        stockDate: data.stockDate || null,
      }).eq('id', id).select().single(),
      supabase.from('ProductVariant').select('id').eq('productId', id),
      supabase.from('StoreLocation').select('*').eq('name', 'Main Store').single()
    ])

    if (productResult.error || !productResult.data) throw productResult.error
    const product = productResult.data

    let defaultLocation = locationResult.data
    if (!defaultLocation) {
      const { data: loc } = await supabase
        .from('StoreLocation')
        .insert({ name: 'Main Store', address: 'Default Address' })
        .select().single()
      defaultLocation = loc
    }

    const existingVariantIds = existingVariantsResult.data?.map(v => v.id) || []
    const incomingVariantIds = data.variants.map(v => v.id).filter(Boolean) as string[]

    // 2. Delete removed variants (batch)
    const toDelete = existingVariantIds.filter(vId => !incomingVariantIds.includes(vId))
    if (toDelete.length > 0) {
      await Promise.all([
        supabase.from('InventoryLevel').delete().in('variantId', toDelete),
        // Wait for inventory deletion before variant deletion due to FK
      ])
      await supabase.from('ProductVariant').delete().in('id', toDelete)
    }

    const variantsToUpdate = data.variants.filter(v => v.id)
    const variantsToCreate = data.variants.filter(v => !v.id)

    // 3. Run all variant UPDATES in parallel (instead of sequential loop)
    const updatePromises = variantsToUpdate.map(v =>
      supabase.from('ProductVariant').update({
        sku: v.sku?.trim() || `SKU-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        sizeId: v.sizeId || null,
        color: v.color || null,
        priceOverride: v.priceOverride || null,
        basePrice: v.basePrice,
        costPrice: v.costPrice || 0,
      }).eq('id', v.id!)
    )

    // 4. Use UPSERT for inventory levels — eliminates the SELECT then INSERT/UPDATE pattern
    const inventoryUpserts = variantsToUpdate.map(v => ({
      variantId: v.id!,
      locationId: defaultLocation!.id,
      quantity: v.quantity,
    }))

    // Run variant updates and inventory upserts in parallel
    await Promise.all([
      ...updatePromises,
      inventoryUpserts.length > 0
        ? supabase.from('InventoryLevel')
            .upsert(inventoryUpserts, { onConflict: 'variantId,locationId' })
        : Promise.resolve()
    ])

    // 5. Batch INSERT new variants (single query)
    if (variantsToCreate.length > 0) {
      const newVariantsPayload = variantsToCreate.map(v => ({
        productId: id,
        sku: v.sku?.trim() || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
        sizeId: v.sizeId || null,
        color: v.color || null,
        priceOverride: v.priceOverride || null,
        basePrice: v.basePrice,
        costPrice: v.costPrice || 0,
      }))

      const { data: newVariants, error: varError } = await supabase
        .from('ProductVariant')
        .insert(newVariantsPayload)
        .select()

      if (varError || !newVariants) throw varError

      const newInventory = newVariants.map((v, idx) => ({
        variantId: v.id,
        locationId: defaultLocation!.id,
        quantity: variantsToCreate[idx].quantity,
      }))

      await supabase.from('InventoryLevel').insert(newInventory)
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
      const { data } = await supabase
        .from('ProductVariant')
        .select('id')
        .eq('sku', finalSku)
        .single()
      
      if (!data) unique = true
    }
    return { success: true, sku: finalSku }
  } catch (error) {
    console.error('Error generating SKU:', error)
    return { success: false, error: 'Failed to generate unique SKU' }
  }
}

