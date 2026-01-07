'use client'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'

interface Product {
  id: string
  name: string
  image_url: string | null
  category: string
  sold_count: number
  price: number
}

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()

  return (
    <article className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 flex flex-col h-full">
      <div className="h-40 bg-gray-100 w-full flex items-center justify-center">
        {product.image_url ? (
          // Next Image may need remote domains configured in next.config.js
          <Image src={product.image_url} alt={product.name} width={320} height={160} className="object-cover h-full w-full" />
        ) : (
          <div className="text-gray-400 text-sm">No Image</div>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <h2 className="text-sm font-semibold text-gray-900 line-clamp-2">{product.name}</h2>
        <p className="text-xs text-gray-500 mb-2">{product.category}</p>
        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="text-blue-600 font-bold">Rp {product.price.toLocaleString('id-ID')}</div>
          <button
            onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, image: product.image_url })}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            Tambah
          </button>
        </div>
      </div>
    </article>
  )
}
