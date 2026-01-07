"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'

interface ProductRow {
  id: string
  name: string
  category?: string
  image_url?: string | null
}

interface PriceRow {
  product_id: string
  price: number
  tier_id: string
}

interface TierRow {
  id: string
  name: string
}

export default function SupabaseCheck() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [prices, setPrices] = useState<PriceRow[]>([])
  const [tiers, setTiers] = useState<TierRow[]>([])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    ;(async () => {
      try {
        const { data: pData, error: pErr } = await supabase.from('products').select('id, name, category, image_url')
        if (pErr) throw pErr

        const { data: priceData, error: priceErr } = await supabase.from('product_prices').select('product_id, price, tier_id')
        if (priceErr) throw priceErr

        const { data: tierData, error: tierErr } = await supabase.from('tiers').select('id, name')
        if (tierErr) throw tierErr

        if (!mounted) return
        setProducts((pData || []) as ProductRow[])
        setPrices((priceData || []) as PriceRow[])
        setTiers((tierData || []) as TierRow[])
      } catch (e: any) {
        setError(e?.message || String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [supabase])

  const tierMap = Object.fromEntries(tiers.map(t => [t.id, t.name]))
  const consumerTierId = tiers.find((t) => t.name === 'Consumer')?.id

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-3">Supabase — Cek Data Produk & Harga</h1>
      {loading && <div className="text-sm text-gray-500">Memuat data dari Supabase…</div>}
      {error && <div className="text-sm text-red-600">Error: {error}</div>}

      {!loading && !error && (
        <div>
          <div className="mb-3 text-sm text-gray-600">Produk: {products.length} — Harga rows: {prices.length} — Tiers: {tiers.length}</div>

          <div className="overflow-auto border rounded">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 border-b">ID</th>
                  <th className="p-2 border-b">Nama</th>
                  <th className="p-2 border-b">Kategori</th>
                  <th className="p-2 border-b">Harga (Consumer)</th>
                  <th className="p-2 border-b">Harga (All tiers)</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => {
                  const consumerPrice = prices.find(pr => pr.product_id === prod.id && pr.tier_id === consumerTierId)?.price
                  const allPrices = prices.filter(pr => pr.product_id === prod.id).map(pr => ({ tier: tierMap[pr.tier_id] || pr.tier_id, price: pr.price }))
                  return (
                    <tr key={prod.id} className="odd:bg-white even:bg-gray-50">
                      <td className="p-2 align-top border-b">{prod.id}</td>
                      <td className="p-2 align-top border-b">{prod.name}</td>
                      <td className="p-2 align-top border-b">{prod.category || '-'}</td>
                      <td className="p-2 align-top border-b">{typeof consumerPrice === 'number' ? `Rp ${consumerPrice.toLocaleString('id-ID')}` : '-'}</td>
                      <td className="p-2 align-top border-b"><pre className="text-xs m-0">{JSON.stringify(allPrices, null, 2)}</pre></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-gray-600">
            Jika tabel kosong atau harga tidak muncul, pastikan Anda sudah mengisi tabel `products`, `tiers`, dan `product_prices` di Supabase dan environment variables `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` terpasang di runtime.
          </div>
        </div>
      )}
    </div>
  )
}
