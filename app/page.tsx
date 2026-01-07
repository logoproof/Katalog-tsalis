'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  category: string;
  sold_count: number;
  price: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      // 1. Ambil data produk
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, image_url, category, sold_count');

      // 2. Ambil harga untuk tier 'Consumer' (Hardcoded dulu utk MVP)
      const { data: tierData } = await supabase
        .from('tiers')
        .select('id')
        .eq('name', 'Consumer')
        .single();

      if (productsData && tierData) {
        // 3. Ambil harga spesifik produk berdasarkan tier Consumer
        const { data: pricesData } = await supabase
          .from('product_prices')
          .select('product_id, price')
          .eq('tier_id', tierData.id);

        // Gabungkan data
        const merged = productsData.map((p) => {
          const priceInfo = pricesData?.find((pr) => pr.product_id === p.id);
          return { ...p, price: priceInfo?.price || 0 };
        });
        setProducts(merged);
      }
      setLoading(false)
    }
    fetchData();
  }, [supabase]);

  return (
    <main>
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Katalog Produk</h1>
        <div className="mt-2 flex items-center justify-between gap-3">
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
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && <p className="text-center text-gray-500 mt-6">Belum ada produk.</p>}
    </main>
  );
}