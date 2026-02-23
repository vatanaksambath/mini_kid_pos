import { create } from 'zustand'

export type ViewType = 'dashboard' | 'pos' | 'inventory' | 'customers' | 'transactions' | 'settings'

interface CartItem {
  variantId: string
  sku: string
  name: string
  variantInfo: string
  price: number
  quantity: number
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
  removeItem: (sku: string) => void
  clearCart: () => void
}

export const useAppStore = create<AppState>((set) => ({
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
  removeItem: (sku) => set((state) => ({
    cart: state.cart.filter((item) => item.sku !== sku)
  })),
  clearCart: () => set({ cart: [] }),
}))
