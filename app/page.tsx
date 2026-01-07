'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/context/CartContext';

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  category: string;
  sold_count: number;
  price: number;
  consumerPrice?: number;
}

const MODE_MAP: Record<string, { tierName: string; multiplier: number; label: string }> = {
  consumer: { tierName: 'Consumer', multiplier: 1, label: 'Konsumen' },
  dropshipper: { tierName: 'Dropshipper', multiplier: 1, label: 'Dropshipper' },
  agen_kecil: { tierName: 'Agen Kecil', multiplier: 1, label: 'Agen Kecil' },
  silver: { tierName: 'Silver', multiplier: 12, label: 'Silver (12 pcs)' },
  gold: { tierName: 'Gold', multiplier: 30, label: 'Gold (30 pcs)' },
  platinum: { tierName: 'Platinum', multiplier: 100, label: 'Platinum (100 pcs)' },
}

// Known package totals provided by business requirements (Rp)
const PACKAGE_TARGETS: Record<string, number> = {
  silver: 6366000,
  gold: 13905000,
  platinum: 37500000,
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'consumer'|'dropshipper'|'agen_kecil'|'silver'|'gold'|'platinum'>('consumer')
  const supabase = createClient();


  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      // 1. Ambil data produk
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, image_url, category, sold_count');

      // 2. Ambil tier berdasarkan mode
      const { tierName } = MODE_MAP[mode]
      const { data: tierData } = await supabase
        .from('tiers')
        .select('id, name')
        .eq('name', tierName)
        .single();

      // Always fetch consumer tier prices so we can show struck-through consumer price
      const { data: consumerTier } = await supabase
        .from('tiers')
        .select('id')
        .eq('name', 'Consumer')
        .single();

      let consumerPrices: { product_id: string; price: number }[] = []
      if (consumerTier) {
        const { data: cp } = await supabase
          .from('product_prices')
          .select('product_id, price')
          .eq('tier_id', consumerTier.id);
        consumerPrices = cp || []
      }

      if (productsData) {
        let merged = productsData.map((p) => ({ ...p, price: 0, consumerPrice: 0 })) as Product[]

        // get selected tier prices (if exists and is different from consumer)
        let tierPrices: { product_id: string; price: number }[] = []
        if (tierData) {
          const { data: pricesData } = await supabase
            .from('product_prices')
            .select('product_id, price')
            .eq('tier_id', tierData.id);
          tierPrices = pricesData || []
        }

        merged = productsData.map((p) => {
          const consumerInfo = consumerPrices.find((pr) => pr.product_id === p.id)
          const tierInfo = tierPrices.find((pr) => pr.product_id === p.id)

          const consumerPrice = consumerInfo?.price || 0
          // if mode is consumer use consumerPrice, else prefer tier price if available, otherwise fallback to consumerPrice
          let activePrice = consumerPrice
          if (mode !== 'consumer' && tierInfo?.price) activePrice = tierInfo.price

          return { ...p, price: activePrice, consumerPrice }
        })

        setProducts(merged);
      }

      setLoading(false)
    }
    fetchData();
  }, [supabase, mode]);

  const addBundleToCart = (product: Product, qty: number) => {
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image_url }, qty)
  }
  const multiplier = MODE_MAP[mode].multiplier
  const bundleTotal = products.reduce((s, p) => s + p.price * multiplier, 0)
  const target = PACKAGE_TARGETS[mode]
  const diff = target ? bundleTotal - target : null

  const { items, totalPrice, addToCart } = useCart()
  const [agenNotice, setAgenNotice] = useState<string | null>(null)

  // persisted package SKUs (localStorage-backed). Keys: 'silver' | 'gold' | 'platinum'
  const [packageSkus, setPackageSkus] = useState<Record<string, string[]>>({})
  const [editingPkgs, setEditingPkgs] = useState<Record<string, string[]>>({})
  const [showPackageManager, setShowPackageManager] = useState(false)
  const [loadingPackages, setLoadingPackages] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // fetch server packages when modal opens (include token to get admin check)
  useEffect(() => {
    if (!showPackageManager) return
    let mounted = true
    setLoadingPackages(true)
    ;(async () => {
      try {
        const supabaseClient = createClient()
        const sess = await supabaseClient.auth.getSession()
        const token = sess?.data?.session?.access_token

        const res = await fetch('/api/packages', token ? { headers: { 'authorization': `Bearer ${token}` } } : undefined)
        const body = await res.json()
        if (!mounted) return
        const pkgs: Record<string, string[]> = {}
        ;(body.packages || []).forEach((p: { name: string; skus: string[] }) => {
          pkgs[p.name] = p.skus || []
        })
        setPackageSkus(pkgs)
        setEditingPkgs(pkgs)
        // set isAdmin if endpoint returned flag
        if (typeof body.is_admin !== 'undefined') {
          setIsAdmin(Boolean(body.is_admin))
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoadingPackages(false)
      }
    })()

    return () => { mounted = false }
  }, [showPackageManager])

  // If user is in agen_kecil mode and cart contains more than one distinct product,
  // we revert mode to consumer and notify the user with a Silver-upgrade suggestion
  useEffect(() => {
    if (mode === 'agen_kecil') {
      const distinctCount = items.length
      if (distinctCount > 1) {
        setMode('consumer')
        const silverTarget = PACKAGE_TARGETS['silver']
        const need = Math.max(0, silverTarget - totalPrice)
        setAgenNotice(`Harga Agen Kecil hanya berlaku untuk pembelian 1 produk (12 pcs). Anda menambahkan produk lain sehingga harga kembali normal. Untuk mendapat keuntungan agen, pertimbangkan menjadi Agen Silver — selisih Rp ${need.toLocaleString('id-ID')}.`)
      }
    }
  }, [items, mode, totalPrice])

  const dismissAgenNotice = () => setAgenNotice(null)



  const addPackageToCart = (pkgMode: 'silver'|'gold'|'platinum') => {
    const skus = packageSkus[pkgMode] && packageSkus[pkgMode].length > 0 ? packageSkus[pkgMode] : products.map(p => p.id)
    const qty = MODE_MAP[pkgMode].multiplier
    skus.forEach(id => {
      const product = products.find(p => p.id === id)
      if (product) addToCart({ id: product.id, name: product.name, price: product.price, image: product.image_url }, qty)
    })

    setAgenNotice(`${pkgMode[0].toUpperCase() + pkgMode.slice(1)} paket ditambahkan ke keranjang.`)
    setShowPackageManager(false)
  }

  return (
    <main>
      <header className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Katalog Produk</h1>

          <div className="flex items-center gap-3">
            <label htmlFor="mode" className="sr-only">Mode Pembelian</label>
            <select id="mode" value={mode} onChange={(e)=>setMode(e.target.value as 'consumer'|'dropshipper'|'agen_kecil'|'silver'|'gold'|'platinum')} className="text-sm rounded-md border border-gray-200 px-2 py-1">
              <option value="consumer">Konsumen</option>
              <option value="dropshipper">Dropshipper</option>
              <option value="agen_kecil">Agen Kecil</option>
              <option value="silver">Silver (12 pcs)</option>
              <option value="gold">Gold (30 pcs)</option>
              <option value="platinum">Platinum (100 pcs)</option>
            </select>

            <button onClick={() => setShowPackageManager(true)} className="ml-2 text-sm px-2 py-1 rounded-md border border-gray-200 text-gray-700">Kelola Paket</button>

            {multiplier > 1 && (
              <div className="text-sm text-gray-600">
                <div>
                  Total paket ({MODE_MAP[mode].label}): <span className="font-semibold">Rp {bundleTotal.toLocaleString('id-ID')}</span>
                  <button
                    onClick={()=>{
                      // add all products in bundle quantities
                      products.forEach(p => addBundleToCart(p, multiplier))
                    }}
                    className="ml-3 px-3 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    Beli Paket
                  </button>
                </div>

                {target && (
                  <div className="mt-1 text-xs">
                    Target paket: <span className="font-medium">Rp {target.toLocaleString('id-ID')}</span>
                    <span className={`ml-2 ${Math.abs((diff as number)) < 1000 ? 'text-green-600' : 'text-red-600'}`}>
                      {diff === 0 ? ' (Sesuai)' : ` (Selisih Rp ${Math.abs((diff as number)).toLocaleString('id-ID')})`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Filter:</span>
            <button className="text-sm px-2 py-1 rounded-md border border-gray-200 text-gray-700">Kategori</button>
            <button className="text-sm px-2 py-1 rounded-md border border-gray-200 text-gray-700">Harga</button>
          </div>

          <div>
            <label htmlFor="sort" className="sr-only">Sort</label>
            <select id="sort" className="text-sm rounded-md border border-gray-200 px-2 py-1">
              <option value="popular">Populer</option>
              <option value="price_asc">Harga: Rendah &rarr; Tinggi</option>
              <option value="price_desc">Harga: Tinggi &rarr; Rendah</option>
            </select>
          </div>
        </div>

        {agenNotice && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            <div className="flex items-start justify-between gap-3">
              <div>{agenNotice}</div>
              <div className="flex items-center gap-2">
                <button
                  className="text-xs text-blue-600"
                  onClick={() => {
                    addPackageToCart('silver')
                    setAgenNotice(null)
                  }}
                >
                  Menjadi Agen Silver
                </button>
                <button className="text-xs text-gray-600" onClick={dismissAgenNotice}>Tutup</button>
              </div>
            </div>
          </div>
        )}
      </header>

      {showPackageManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-md p-4 w-full max-w-3xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Kelola Paket (Silver / Gold / Platinum)</h3>
              <button className="text-sm text-gray-600" onClick={() => setShowPackageManager(false)}>Tutup</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['silver','gold','platinum'] as const).map((pkg) => (
                <div key={pkg} className="p-2 border border-gray-100 rounded">
                  <h4 className="text-sm font-medium mb-2">{pkg.toUpperCase()}</h4>

                  {loadingPackages ? (
                    <div className="text-xs text-gray-500">Memuat…</div>
                  ) : (
                    <div className="max-h-40 overflow-auto space-y-2">
                      {products.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={(editingPkgs[pkg] || []).includes(p.id)}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setEditingPkgs((prev) => {
                                const copy = { ...prev }
                                copy[pkg] = copy[pkg] ? [...copy[pkg]] : []
                                if (checked) {
                                  if (!copy[pkg].includes(p.id)) copy[pkg].push(p.id)
                                } else {
                                  copy[pkg] = copy[pkg].filter((id) => id !== p.id)
                                }
                                return copy
                              })
                            }}
                          />
                          <span>{p.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1 border rounded" onClick={() => setShowPackageManager(false)}>Batal</button>
              {isAdmin ? (
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={async () => {
                    // Save via API (requires admin auth)
                    try {
                      const supabase = createClient()
                      const sess = await supabase.auth.getSession()
                      const token = sess?.data?.session?.access_token
                      if (!token) throw new Error('auth required')

                      const res = await fetch('/api/packages', {
                        method: 'PUT',
                        headers: {
                          'content-type': 'application/json',
                          'authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ name: 'silver', skus: editingPkgs['silver'] || [] })
                      })
                      if (!res.ok) throw new Error('failed to save')
                      await fetch('/api/packages', { method: 'PUT', headers: { 'content-type': 'application/json', 'authorization': `Bearer ${token}` }, body: JSON.stringify({ name: 'gold', skus: editingPkgs['gold'] || [] }) })
                      await fetch('/api/packages', { method: 'PUT', headers: { 'content-type': 'application/json', 'authorization': `Bearer ${token}` }, body: JSON.stringify({ name: 'platinum', skus: editingPkgs['platinum'] || [] }) })

                      // refresh
                      const list = await (await fetch('/api/packages', token ? { headers: { 'authorization': `Bearer ${token}` } } : undefined)).json()
                      const pkgs: Record<string, string[]> = {}
                      ;(list.packages || []).forEach((p: { name: string; skus: string[] }) => { pkgs[p.name] = p.skus || [] })
                      setPackageSkus(pkgs)
                      setEditingPkgs(pkgs)
                      setShowPackageManager(false)
                      setAgenNotice('Paket tersimpan')
                    } catch {
                      setAgenNotice('Gagal menyimpan paket. Pastikan Anda login sebagai admin.')
                    }
                  }}
                >
                  Simpan Paket
                </button>
              ) : (
                <div className="text-xs text-gray-500 px-3 py-1">Anda tidak memiliki izin untuk menyimpan paket. Login sebagai admin untuk menyimpan.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} mode={mode} />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && <p className="text-center text-gray-500 mt-6">Belum ada produk.</p>}
    </main>
  );
}