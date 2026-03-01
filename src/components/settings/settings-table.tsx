'use client'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Edit, Plus } from 'lucide-react'
import { useState, useTransition } from 'react'
import { deleteSetting } from '@/actions/settings'
import { useAppStore } from '@/store/use-app-store'
interface SettingsTableProps {
  title: string
  type: 'category' | 'brand' | 'social' | 'size' | 'color' | 'source'
  data: { id: string; name: string; hex?: string }[]
  onCreate: (name: string, hex?: string) => Promise<any>
  onUpdate: (id: string, name: string, hex?: string) => Promise<any>
  onRefresh: () => void
  loading?: boolean
}

export default function SettingsTable({ title, type, data, onCreate, onUpdate, onRefresh, loading }: SettingsTableProps) {
  const showGlobalAlert = useAppStore(state => state.showGlobalAlert)
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<{ id: string; name: string; hex?: string } | null>(null)
  const [name, setName] = useState('')
  const [hex, setHex] = useState('#000000')

  const isColor = type === 'color'

  const handleOpenCreate = () => {
    setEditItem(null)
    setName('')
    setHex('#000000')
    setModalOpen(true)
  }

  const handleOpenEdit = (item: { id: string; name: string; hex?: string }) => {
    setEditItem(item)
    setName(item.name)
    setHex(item.hex || '#000000')
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    startTransition(async () => {
      let res
      if (editItem) {
        res = await onUpdate(editItem.id, name, isColor ? hex : undefined)
      } else {
        res = await onCreate(name, isColor ? hex : undefined)
      }

      if (res.success) {
        setModalOpen(false)
        onRefresh()
      } else {
        showGlobalAlert('error', 'Error', res.error || 'Operation failed')
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return
    const res = await deleteSetting(type, id)
    if (res.success) {
      onRefresh()
    } else {
      showGlobalAlert('error', 'Error', res.error || 'Operation failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{title}</h3>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>

      <div className="border rounded-md">
        {/* Desktop Table */}
        <Table className="hidden sm:table">
          <TableHeader>
            <TableRow>
              {isColor && <TableHead className="w-16">Color</TableHead>}
              <TableHead>Name</TableHead>
              {isColor && <TableHead>Hex Code</TableHead>}
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {isColor && <TableCell><div className="h-7 w-7 rounded-full bg-muted animate-pulse" /></TableCell>}
                  <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                  {isColor && <TableCell><div className="h-3 w-16 bg-muted animate-pulse rounded" /></TableCell>}
                  <TableCell><div className="h-8 w-20 bg-muted animate-pulse rounded mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isColor ? 4 : 2} className="h-24 text-center text-muted-foreground">
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  {isColor && (
                    <TableCell>
                      <div className="h-7 w-7 rounded-full border shadow-sm" style={{ backgroundColor: item.hex || '#000' }} />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{item.name}</TableCell>
                  {isColor && <TableCell className="text-xs text-muted-foreground font-mono">{item.hex}</TableCell>}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Mobile Card List */}
        <div className="sm:hidden flex flex-col divide-y bg-card border-x border-b">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-muted animate-pulse shrink-0" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    {isColor && <div className="h-3 w-12 bg-muted animate-pulse rounded" />}
                  </div>
                </div>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))
          ) : data.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No {type}s added yet.</div>
          ) : (
            data.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {isColor && (
                    <div className="h-8 w-8 rounded-full border shadow-sm shrink-0" style={{ backgroundColor: item.hex || '#000' }} />
                  )}
                  {!isColor && (
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                      <span className="font-semibold text-xs text-muted-foreground">ID</span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    {isColor && <p className="text-xs text-muted-foreground font-mono">{item.hex}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleOpenEdit(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? `Edit ${title}` : `Add New ${title}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Enter ${title.toLowerCase()} name...`}
                required
              />
            </div>
            {isColor && (
              <div className="space-y-2">
                <Label>Hex Color</Label>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md border shadow-sm shrink-0" style={{ backgroundColor: hex }} />
                  <Input
                    type="color"
                    value={hex}
                    onChange={(e) => setHex(e.target.value)}
                    className="cursor-pointer h-9 w-20 p-1"
                  />
                  <Input
                    value={hex}
                    onChange={(e) => setHex(e.target.value)}
                    placeholder="#000000"
                    className="font-mono text-sm flex-1"
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
