import { create } from 'zustand'
import { getCategories, getBrands, getSizes, getColors, getProductSources } from '@/actions/settings'

export type ViewType = 'dashboard' | 'pos' | 'inventory' | 'customers' | 'transactions' | 'settings' | 'reports'

interface CartItem {
  variantId: string
  sku: string
  name: string
  variantInfo: string
  price: number
  costPrice: number
  quantity: number
  availableStock?: number
}

interface SettingsCache {
  categories: any[]
  brands: any[]
  sizes: any[]
  colors: any[]
  sources: any[]
  loaded: boolean
}

interface AppState {
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
  
  // Global Alert Modal State
  globalAlert: {
    isOpen: boolean
    type: 'success' | 'error' | 'info' | 'warning'
    title: string
    message: string
  }
  showGlobalAlert: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void
  hideGlobalAlert: () => void
  
  // POS Cart State (Persistent SPA)
  cart: CartItem[]
  setCart: (cart: CartItem[]) => void
  addItemToCart: (item: CartItem) => void
  updateQuantity: (sku: string, delta: number) => void
  setQuantityDirect: (sku: string, qty: number) => void
  removeItem: (sku: string) => void
  clearCart: () => void

  // Global Data Cache
  products: any[]
  setProducts: (products: any[]) => void
  orders: any[]
  setOrders: (orders: any[]) => void
  customers: any[]
  setCustomers: (customers: any[]) => void

  // Settings Reference Data Cache (loaded once per session)
  settingsCache: SettingsCache
  loadSettingsCache: () => Promise<void>
  invalidateSettingsCache: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),

  globalAlert: {
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  },
  showGlobalAlert: (type, title, message) => set({ globalAlert: { isOpen: true, type, title, message } }),
  hideGlobalAlert: () => set((state) => ({ globalAlert: { ...state.globalAlert, isOpen: false } })),

  cart: [],
  setCart: (cart) => set({ cart }),
  addItemToCart: (item) => set((state) => {
    const existing = state.cart.find((i) => i.sku === item.sku)
    if (existing) {
      return {
        cart: state.cart.map((i) => 
          i.sku === item.sku ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
    }
    return { cart: [...state.cart, item] }
  }),
  updateQuantity: (sku, delta) => set((state) => ({
    cart: state.cart.map((item) =>
      item.sku === sku
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    )
  })),
  setQuantityDirect: (sku, qty) => set((state) => ({
    cart: state.cart.map((item) =>
      item.sku === sku
        ? { ...item, quantity: Math.min(Math.max(1, qty), item.availableStock ?? qty) }
        : item
    )
  })),
  removeItem: (sku) => set((state) => ({
    cart: state.cart.filter((item) => item.sku !== sku)
  })),
  clearCart: () => set({ cart: [] }),

  products: [],
  setProducts: (products) => set({ products }),
  orders: [],
  setOrders: (orders) => set({ orders }),
  customers: [],
  setCustomers: (customers) => set({ customers }),

  // Settings cache — fetched once per session, reused instantly for every modal open
  settingsCache: { categories: [], brands: [], sizes: [], colors: [], sources: [], loaded: false },
  loadSettingsCache: async () => {
    const { settingsCache } = get()
    if (settingsCache.loaded) return // Already loaded — skip network round-trips
    const [catRes, brandRes, sizeRes, colorRes, sourceRes] = await Promise.all([
      getCategories(), getBrands(), getSizes(), getColors(), getProductSources()
    ])
    set({
      settingsCache: {
        categories: catRes.success ? catRes.data || [] : [],
        brands: brandRes.success ? brandRes.data || [] : [],
        sizes: sizeRes.success ? sizeRes.data || [] : [],
        colors: colorRes.success ? colorRes.data || [] : [],
        sources: sourceRes.success ? sourceRes.data || [] : [],
        loaded: true,
      }
    })
  },
  invalidateSettingsCache: () =>
    set({ settingsCache: { categories: [], brands: [], sizes: [], colors: [], sources: [], loaded: false } }),
}))
