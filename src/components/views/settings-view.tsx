'use client'

import { 
  getCategories, createCategory, updateCategory,
  getBrands, createBrand, updateBrand,
  getSocialMediaTypes, createSocialMediaType, updateSocialMediaType,
  getSizes, createSize, updateSize,
  getColors, createColor, updateColor,
  getLoyaltyPrizes,
  getBankPaymentTypes,
} from '@/actions/settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button'
import { RefreshCw, Tag, Award, Ruler, Radio, Palette, Gift, CreditCard, Receipt } from 'lucide-react'
import SettingsTable from '@/components/settings/settings-table'
import LoyaltyPrizeTable from '@/components/settings/loyalty-prize-table'
import BankPaymentTable from '@/components/settings/bank-payment-table'
import ReceiptTemplateForm from '@/components/settings/receipt-template-form'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '../ui/card'
import { cn } from '@/lib/utils'

const TABS = [
  { value: 'categories', label: 'Categories', Icon: Tag },
  { value: 'brands',     label: 'Brands',     Icon: Award },
  { value: 'sizes',      label: 'Sizes',      Icon: Ruler },
  { value: 'social',     label: 'Platforms',  Icon: Radio },
  { value: 'colors',     label: 'Colors',     Icon: Palette },
  { value: 'loyalty',    label: 'Loyalty',    Icon: Gift },
  { value: 'banks',      label: 'Payment Methods', Icon: CreditCard },
  { value: 'receipt',    label: 'Receipt',    Icon: Receipt },
]

export default function SettingsView() {
  const [categories, setCategories]   = useState<any[]>([])
  const [brands, setBrands]           = useState<any[]>([])
  const [socialTypes, setSocialTypes] = useState<any[]>([])
  const [sizes, setSizes]             = useState<any[]>([])
  const [colors, setColors]           = useState<any[]>([])
  const [prizes, setPrizes]           = useState<any[]>([])
  const [banks, setBanks]             = useState<any[]>([])
  const [loading, setLoading]         = useState(true)

  const loadAll = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    const [catRes, brandRes, socialRes, sizeRes, colorRes, prizeRes, bankRes] = await Promise.all([
      getCategories(), getBrands(), getSocialMediaTypes(), getSizes(), getColors(), getLoyaltyPrizes(), getBankPaymentTypes()
    ])
    if (catRes.success)   setCategories(catRes.data || [])
    if (brandRes.success) setBrands(brandRes.data || [])
    if (socialRes.success) setSocialTypes(socialRes.data || [])
    if (sizeRes.success)  setSizes(sizeRes.data || [])
    if (colorRes.success) setColors(colorRes.data || [])
    if (prizeRes.success) setPrizes(prizeRes.data || [])
    if (bankRes.success)  setBanks(bankRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  return (
    <div className="flex-1 space-y-6 p-4 lg:p-8 pt-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Configuration</h2>
          <p className="text-muted-foreground text-sm">Manage global system parameters and master data.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadAll(true)} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="categories" className="w-full">
            {/* Modern tab bar */}
            <div className="border-b bg-muted/20 overflow-x-auto">
              <TabsList className="h-auto bg-transparent rounded-none flex gap-0 p-0 w-max min-w-full">
                {TABS.map(({ value, label, Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className={cn(
                      "relative flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors whitespace-nowrap",
                      "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-background",
                      "hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="categories" className="mt-0 outline-none">
                <SettingsTable title="Category" type="category" data={categories} onCreate={createCategory} onUpdate={updateCategory} onRefresh={() => loadAll(true)} />
              </TabsContent>

              <TabsContent value="brands" className="mt-0 outline-none">
                <SettingsTable title="Brand" type="brand" data={brands} onCreate={createBrand} onUpdate={updateBrand} onRefresh={() => loadAll(true)} />
              </TabsContent>

              <TabsContent value="sizes" className="mt-0 outline-none">
                <SettingsTable title="Size" type="size" data={sizes} onCreate={createSize} onUpdate={updateSize} onRefresh={() => loadAll(true)} />
              </TabsContent>

              <TabsContent value="social" className="mt-0 outline-none">
                <SettingsTable title="Social Media Type" type="social" data={socialTypes} onCreate={createSocialMediaType} onUpdate={updateSocialMediaType} onRefresh={() => loadAll(true)} />
              </TabsContent>

              <TabsContent value="colors" className="mt-0 outline-none">
                <SettingsTable title="Color" type="color" data={colors} onCreate={createColor} onUpdate={updateColor} onRefresh={() => loadAll(true)} />
              </TabsContent>

              <TabsContent value="loyalty" className="mt-0 outline-none">
                <LoyaltyPrizeTable data={prizes} onRefresh={() => loadAll(true)} />
              </TabsContent>

              <TabsContent value="banks" className="mt-0 outline-none">
                <BankPaymentTable data={banks} onRefresh={() => loadAll(true)} />
              </TabsContent>

              <TabsContent value="receipt" className="mt-0 outline-none">
                <div className="space-y-2 mb-6">
                  <h3 className="text-xl font-semibold">Receipt Template</h3>
                  <p className="text-sm text-muted-foreground">Customize how your receipts look when printed from the POS.</p>
                </div>
                <ReceiptTemplateForm />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
