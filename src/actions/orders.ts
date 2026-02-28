'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export async function createOrder(data: {
  customerId?: string
  locationId: string
  totalAmount: number
  discountAmount?: number
  discountType?: 'none' | 'flat' | 'percent'
  loyaltyPointsRedeemed?: number
  items: {
    variantId: string
    quantity: number
    price: number
    costPrice: number
    description?: string
  }[]
  payments: {
    amount: number
    paymentMethod: 'CASH' | 'CARD' | 'GIFT_CARD' | 'MOBILE_PAYMENT' | 'BANK_TRANSFER'
    bankPaymentTypeId?: string
  }[]
  shippingFee?: number
  status?: 'PENDING' | 'COMPLETED'
}) {
  try {
    // Resolve authenticated user from JWT cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    const decoded = token ? verifyToken(token) as any : null
    if (!decoded?.email) throw new Error('Not authenticated')

    // Look up the actual user from the DB by email (ensures FK-valid ID)
    const { data: authUser } = await supabase
      .from('User')
      .select('id')
      .eq('email', decoded.email)
      .single()
    if (!authUser?.id) throw new Error('User not found')
    const userId = authUser.id
    // 0. Generate sequential order number
    const { count } = await supabase.from('Order').select('*', { count: 'exact', head: true })
    const nextNum = (count || 0) + 1
    const orderNumber = `ORD-${String(nextNum).padStart(4, '0')}`

    // 1. Create the Order
    const { data: newOrder, error: orderError } = await supabase
      .from('Order')
      .insert({
        orderNumber,
        customerId: data.customerId || null,
        userId,
        locationId: data.locationId,
        totalAmount: data.totalAmount,
        shippingFee: data.shippingFee || 0,
        discountAmount: data.discountAmount || 0,
        discountType: data.discountType || 'none',
        status: data.status || 'COMPLETED',
      })
      .select()
      .single()

    if (orderError || !newOrder) {
      throw new Error(orderError?.message || 'Failed to create order record')
    }

    // Insert Line Items
    if (data.items.length > 0) {
      const lineItems = data.items.map(item => ({
        orderId: newOrder.id,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
        costPrice: item.costPrice,
        description: item.description || null,
        status: 'SOLD',
      }))
      const { error: lineItemsError } = await supabase.from('OrderLineItem').insert(lineItems)
      if (lineItemsError) throw lineItemsError
    }

    // Insert Payments — map BANK_TRANSFER → MOBILE_PAYMENT (not in DB enum)
    if (data.payments.length > 0) {
      const payments = data.payments.map(p => ({
        orderId: newOrder.id,
        amount: p.amount,
        paymentMethod: p.paymentMethod === 'BANK_TRANSFER' ? 'MOBILE_PAYMENT' : p.paymentMethod,
      }))
      const { error: paymentsError } = await supabase.from('PaymentTransaction').insert(payments)
      if (paymentsError) throw paymentsError
    }

    // 2. Update Inventory Levels manually
    for (const item of data.items) {
      const { data: inventory } = await supabase
        .from('InventoryLevel')
        .select('*')
        .eq('variantId', item.variantId)
        .eq('locationId', data.locationId)
        .single()

      if (!inventory || inventory.quantity < item.quantity) {
        throw new Error(`Insufficient stock for variant ${item.variantId}`)
      }

      const { error: invError } = await supabase
        .from('InventoryLevel')
        .update({ quantity: inventory.quantity - item.quantity })
        .eq('id', inventory.id)

      if (invError) throw invError
    }

    // 3. Update Loyalty Points if customer exists
    if (data.customerId) {
      const { data: customer } = await supabase
        .from('Customer')
        .select('loyaltyPoints')
        .eq('id', data.customerId)
        .single()

      const { data: template } = await supabase
        .from('ReceiptTemplate')
        .select('loyaltyEarnRate')
        .eq('id', 'default')
        .single()
      
      const earnRate = template?.loyaltyEarnRate ?? 1

      if (customer) {
        const earned = Math.floor(data.totalAmount * earnRate)
        const redeemed = data.loyaltyPointsRedeemed || 0
        const newPoints = Math.max(0, customer.loyaltyPoints + earned - redeemed)
        await supabase
          .from('Customer')
          .update({ loyaltyPoints: newPoints })
          .eq('id', data.customerId)
      }
    }

    revalidatePath('/')
    
    const serializedOrder = {
      ...newOrder,
      totalAmount: Number(newOrder.totalAmount),
    }

    return { success: true, data: serializedOrder }
  } catch (error: any) {
    console.error('Error creating order:', error)
    return { success: false, error: error.message || 'Failed to create order' }
  }
}

export async function getCustomers() {
  try {
    const { data: customers, error } = await supabase
      .from('Customer')
      .select(`
        *,
        socialMedia:CustomerSocialMedia(
          *,
          socialMediaType:SocialMediaType(*)
        )
      `)
      .order('name', { ascending: true })

    if (error) throw error
    return { success: true, data: customers || [] }
  } catch (error) {
    console.error('Error fetching customers:', error)
    return { success: false, error: 'Failed to fetch customers' }
  }
}

export async function createCustomer(data: {
  name: string
  email?: string
  phone?: string
  address?: string
  socials?: {
    typeId: string
    handle: string
  }[]
}) {
  try {
    const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .insert({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      })
      .select()
      .single()

    if (customerError || !customer) throw customerError

    if (data.socials && data.socials.length > 0) {
      const socialsToInsert = data.socials.map(s => ({
        customerId: customer.id,
        socialMediaTypeId: s.typeId,
        handle: s.handle
      }))
      await supabase.from('CustomerSocialMedia').insert(socialsToInsert)
    }

    revalidatePath('/')
    return { success: true, data: customer }
  } catch (error) {
    console.error('Error creating customer:', error)
    return { success: false, error: 'Failed to create customer' }
  }
}

export async function deleteCustomer(id: string) {
  try {
    // Delete relations first manually
    await supabase.from('CustomerSocialMedia').delete().eq('customerId', id)
    const { error } = await supabase.from('Customer').delete().eq('id', id)
    
    if (error) throw error

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error deleting customer:', error)
    return { success: false, error: 'Failed to delete customer. They might have orders.' }
  }
}

export async function updateCustomer(id: string, data: any) {
  try {
    const { data: customer, error } = await supabase
      .from('Customer')
      .update({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/')
    return { success: true, data: customer }
  } catch (error) {
    console.error('Error updating customer:', error)
    return { success: false, error: 'Failed to update customer' }
  }
}

export async function getOrders(limit = 100) {
  noStore();
  try {
    const { data, error } = await supabase
      .from('Order')
      .select(`
        *,
        customer:Customer(id, name, phone),
        location:StoreLocation(name),
        items:OrderLineItem(
          *,
          variant:ProductVariant(
            sku,
            product:Product(name)
          )
        ),
        payments:PaymentTransaction(*)
      `)
      .order('createdAt', { ascending: false })
      .limit(limit)
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching orders:', error)
    return { success: false, error: 'Failed to fetch orders' }
  }
}

export async function updateOrderStatus(id: string, status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'RETURNED' | 'PARTIALLY_RETURNED') {
  try {
    const { data, error } = await supabase
      .from('Order')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/')
    return { success: true, data }
  } catch (error) {
    console.error('Error updating order status:', error)
    return { success: false, error: 'Failed to update order status' }
  }
}
