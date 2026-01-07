'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import Image from 'next/image';

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
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      // 1. Ambil data produk
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, image_url, category, sold_count');

      // 2. Ambil harga untuk tier 'Consumer' (Hardcoded dulu utk MVP)
      // Nanti kita ganti logic ini jika user login
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
    }
    fetchData();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Katalog Produk</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <div className="h-32 bg-gray-200 w-full object-cover">
              {/* Placeholder Image jika null */}
              {product.image_url ? (
                <Image src={product.image_url} alt={product.name} width={128} height={128} className="h-full w-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Image</div>
              )}
            </div>
            <div className="p-3">
              <h2 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[40px]">
                {product.name}
              </h2>
              <p className="text-xs text-gray-500 mb-2">{product.category}</p>
              <div className="flex justify-between items-end">
                <span className="text-blue-600 font-bold text-sm">
                  Rp {product.price.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-gray-400">
                  Terjual {product.sold_count}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}