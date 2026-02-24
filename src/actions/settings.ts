'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// Categories
export async function getCategories() {
  try {
    const { data, error } = await supabase.from('Category').select('*').order('name', { ascending: true })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch categories' }
  }
}

export async function createCategory(name: string) {
  try {
    const { data, error } = await supabase.from('Category').insert([{ name }]).select().single()
    if (error) throw error
    revalidatePath('/settings')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to create category' }
  }
}

export async function updateCategory(id: string, name: string) {
  try {
    const { data, error } = await supabase.from('Category').update({ name }).eq('id', id).select().single()
    if (error) throw error
    revalidatePath('/settings')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to update category' }
  }
}

// Brands
export async function getBrands() {
  try {
    const { data, error } = await supabase.from('Brand').select('*').order('name', { ascending: true })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch brands' }
  }
}

export async function createBrand(name: string) {
  try {
    const { data, error } = await supabase.from('Brand').insert([{ name }]).select().single()
    if (error) throw error
    revalidatePath('/settings')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to create brand' }
  }
}

export async function updateBrand(id: string, name: string) {
  try {
    const { data, error } = await supabase.from('Brand').update({ name }).eq('id', id).select().single()
    if (error) throw error
    revalidatePath('/settings')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to update brand' }
  }
}

// Social Media Types
export async function getSocialMediaTypes() {
  try {
    const { data, error } = await supabase.from('SocialMediaType').select('*').order('name', { ascending: true })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch social media types' }
  }
}

export async function createSocialMediaType(name: string) {
  try {
    const { data, error } = await supabase.from('SocialMediaType').insert([{ name }]).select().single()
    if (error) throw error
    revalidatePath('/settings')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to create social media type' }
  }
}

export async function updateSocialMediaType(id: string, name: string) {
  try {
    const { data, error } = await supabase.from('SocialMediaType').update({ name }).eq('id', id).select().single()
    if (error) throw error
    revalidatePath('/settings')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to update social media type' }
  }
}

// Sizes
export async function getSizes() {
  try {
    const { data, error } = await supabase.from('Size').select('*').order('name', { ascending: true })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch sizes' }
  }
}

export async function createSize(name: string) {
  try {
    const { data, error } = await supabase.from('Size').insert([{ name }]).select().single()
    if (error) throw error
    revalidatePath('/settings')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to create size' }
  }
}

export async function updateSize(id: string, name: string) {
  try {
    const { data, error } = await supabase.from('Size').update({ name }).eq('id', id).select().single()
    if (error) throw error
    revalidatePath('/settings')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to update size' }
  }
}

// Colors
export async function getColors() {
  try {
    const { data, error } = await supabase.from('Color').select('*').order('name', { ascending: true })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch colors' }
  }
}

export async function createColor(name: string, hex?: string) {
  try {
    const { data, error } = await supabase.from('Color').insert([{ name, hex: hex || '#000000' }]).select().single()
    if (error) throw error
    revalidatePath('/settings')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to create color' }
  }
}

export async function updateColor(id: string, name: string, hex?: string) {
  try {
    const { data, error } = await supabase.from('Color').update({ name, hex: hex || '#000000' }).eq('id', id).select().single()
    if (error) throw error
    revalidatePath('/settings')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to update color' }
  }
}

// Loyalty Prizes
export async function getLoyaltyPrizes() {
  try {
    const { data, error } = await supabase.from('LoyaltyPrize').select('*').order('pointsCost', { ascending: true })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch loyalty prizes' }
  }
}

export async function createLoyaltyPrize(name: string, pointsCost: number, description?: string) {
  try {
    const { data, error } = await supabase.from('LoyaltyPrize').insert([{ name, pointsCost, description }]).select().single()
    if (error) throw error
    revalidatePath('/settings')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to create loyalty prize' }
  }
}

export async function updateLoyaltyPrize(id: string, name: string, pointsCost: number, description?: string) {
  try {
    const { data, error } = await supabase.from('LoyaltyPrize').update({ name, pointsCost, description }).eq('id', id).select().single()
    if (error) throw error
    revalidatePath('/settings')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to update loyalty prize' }
  }
}

export async function deleteLoyaltyPrize(id: string) {
  try {
    const { error } = await supabase.from('LoyaltyPrize').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete loyalty prize' }
  }
}

export async function deleteSetting(type: 'category' | 'brand' | 'social' | 'size' | 'color' | 'bank', id: string) {
  try {
    let error;
    if (type === 'category') {
      ({ error } = await supabase.from('Category').delete().eq('id', id))
    } else if (type === 'brand') {
      ({ error } = await supabase.from('Brand').delete().eq('id', id))
    } else if (type === 'social') {
      ({ error } = await supabase.from('SocialMediaType').delete().eq('id', id))
    } else if (type === 'size') {
      ({ error } = await supabase.from('Size').delete().eq('id', id))
    } else if (type === 'color') {
      ({ error } = await supabase.from('Color').delete().eq('id', id))
    } else if (type === 'bank') {
      ({ error } = await supabase.from('BankPaymentType').delete().eq('id', id))
    }

    if (error) throw error
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete. It might be in use.' }
  }
}

// Bank Payment Types
export async function getBankPaymentTypes() {
  try {
    const { data, error } = await supabase
      .from('BankPaymentType')
      .select('*')
      .order('sortOrder', { ascending: true })
      .order('name', { ascending: true })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch payment methods' }
  }
}

export async function createBankPaymentType(data: {
  name: string
  type: 'CASH' | 'CARD' | 'GIFT_CARD' | 'MOBILE_PAYMENT'
  isActive?: boolean
  sortOrder?: number
  accountNo?: string
  accountName?: string
  qrImageUrl?: string
}) {
  try {
    const { data: row, error } = await supabase.from('BankPaymentType').insert([{
      ...data,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 99,
    }]).select().single()
    if (error) throw error
    revalidatePath('/settings')
    return { success: true, data: row }
  } catch (error) {
    return { success: false, error: 'Failed to create payment method' }
  }
}

export async function updateBankPaymentType(id: string, data: {
  name?: string
  type?: 'CASH' | 'CARD' | 'GIFT_CARD' | 'MOBILE_PAYMENT'
  isActive?: boolean
  sortOrder?: number
  accountNo?: string
  accountName?: string
  qrImageUrl?: string
}) {
  try {
    const { data: row, error } = await supabase.from('BankPaymentType').update(data).eq('id', id).select().single()
    if (error) throw error
    revalidatePath('/settings')
    return { success: true, data: row }
  } catch (error) {
    return { success: false, error: 'Failed to update payment method' }
  }
}

// Receipt Template
export async function getReceiptTemplate() {
  try {
    const { data, error } = await supabase.from('ReceiptTemplate').select('*').eq('id', 'default').single()
    if (error && error.code !== 'PGRST116') throw error
    return { success: true, data: data || null }
  } catch (error) {
    return { success: false, error: 'Failed to fetch receipt template' }
  }
}

export async function upsertReceiptTemplate(data: {
  shopName: string
  address?: string
  phone1?: string
  phone1Provider?: string
  phone2?: string
  phone2Provider?: string
  logoUrl?: string
  bankAccountNo?: string
  bankAccountName?: string
  bankQrImageUrl?: string
  bottomMessage?: string
  exchangeRate?: number
  defaultDeliveryPrice?: number
  loyaltyEarnRate?: number
  loyaltyRedeemValue?: number
}) {
  try {
    const { error } = await supabase.from('ReceiptTemplate').upsert({ id: 'default', ...data, updatedAt: new Date().toISOString() })
    if (error) throw error
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to save receipt template' }
  }
}

