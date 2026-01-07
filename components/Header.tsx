'use client'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'

export default function Header() {
  const [query, setQuery] = useState('')
  const { totalCount, openCart, cartOpen } = useCart()

  return (
    <header className="w-full bg-white border-b border-gray-100">
      <div className="max-w-full sm:max-w-xl md:max-w-2xl lg:w-1/2 mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo Tsalis" className="h-8 w-8" />
          <div className="text-xl font-extrabold">Katalog <span className="text-blue-600">Tsalis</span></div>
        </div>

        <div className="flex-1">
          <label htmlFor="search" className="sr-only">Cari produk</label>
          <div className="relative">
            <input
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari produk..."
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            aria-label="Keranjang"
            aria-expanded={cartOpen}
            onClick={openCart}
            className="relative inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
          >
            <span className="sr-only">Buka keranjang</span>
            Cart
            <span className="ml-2 bg-white text-blue-600 rounded-full px-2 text-xs font-semibold">{totalCount}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
