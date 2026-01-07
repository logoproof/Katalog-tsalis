'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'

interface Product {
  id: string
  name: string
  image_url: string | null
  category: string
  sold_count: number
  price: number
  consumerPrice?: number
}

export default function ProductCard({ product, mode }: { product: Product, mode: 'consumer'|'dropshipper'|'agen_kecil'|'silver'|'gold'|'platinum' }) {
  const { addToCart, items } = useCart()
  const [imgError, setImgError] = useState(false)

  const isAgenKecilMode = mode === 'agen_kecil'
  // If agen kecil mode, add 12 pcs per click; otherwise 1
  const qtyToAdd = isAgenKecilMode ? 12 : 1

  // if there is already another product in cart (different id) then agent kecil rules will be invalidated by page logic
  const otherProductExists = items.some(i => i.id !== product.id)

  const showStruckConsumer = typeof product.consumerPrice === 'number' && product.consumerPrice > 0 && product.consumerPrice !== product.price

  return (
    <article className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 flex flex-col h-full">
      <div className="h-40 bg-gray-100 w-full relative overflow-hidden">
        {product.image_url && !imgError ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="text-gray-400 text-sm flex items-center justify-center h-full">No Image</div>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <h2 className="text-sm font-semibold text-gray-900 line-clamp-2">{product.name}</h2>
        <p className="text-xs text-gray-500 mb-2">{product.category}</p>

        {isAgenKecilMode && !otherProductExists && (
          <div className="mb-2 text-xs text-green-700">Agen Kecil aktif: beli 12 pcs untuk mendapatkan harga agen</div>
        )}

        {isAgenKecilMode && otherProductExists && (
          <div className="mb-2 text-xs text-red-600">Agen Kecil tidak berlaku saat ada lebih dari 1 produk di keranjang</div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3">
          <div>
            {showStruckConsumer && (
              <div className="text-xs text-gray-500 line-through">Rp {product.consumerPrice?.toLocaleString('id-ID')}</div>
            )}

            <div className="flex items-center gap-2">
              <div className="text-blue-600 font-bold">Rp {product.price.toLocaleString('id-ID')}</div>

              {(() => {
                const consumer = product.consumerPrice ?? 0
                const saved = Math.max(0, consumer - product.price)
                const percent = saved > 0 && consumer > 0 ? Math.round((saved / consumer) * 100) : 0
                return saved > 0 ? (
                  <div title={`Hemat Rp ${saved.toLocaleString('id-ID')}`} className="ml-2 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded">
                    -{percent}%
                  </div>
                ) : null
              })()}
            </div>
          </div>

          <button
            onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, image: product.image_url }, qtyToAdd)}
            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 touch-manipulation"
            aria-label={`Tambah ${product.name} ke keranjang`}
          >
            Tambah
          </button>
        </div>
      </div>
    </article>
  )
}
