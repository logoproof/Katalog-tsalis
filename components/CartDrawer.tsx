'use client'
import { useEffect } from 'react'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'

export default function CartDrawer(){
  const { cartOpen, closeCart, items, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart()

  useEffect(()=>{
    // disable body scroll when cart is open
    if(typeof document !== 'undefined'){
      if(cartOpen) document.body.style.overflow = 'hidden'
      else document.body.style.overflow = ''
    }
  },[cartOpen])

  return (
    <div aria-hidden={!cartOpen} className={`fixed inset-0 z-50 transition-opacity ${cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/40" onClick={closeCart} />

      <aside className={`absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl transform transition-transform ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`} role="dialog" aria-modal="true">
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Keranjang</h3>
            <button aria-label="Tutup keranjang" onClick={closeCart} className="text-gray-500 px-2 py-1">✕</button>
          </div>

          <div className="flex-1 overflow-auto">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">Keranjang kosong</div>
            ) : (
              <ul className="space-y-4">
                {items.map(item => (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden relative flex items-center justify-center text-xs text-gray-400">
                      {item.image ? (
                        // show small image if available
                        <Image src={item.image} alt={item.name} width={64} height={64} className="object-cover" />
                      ) : (
                        <span>No Image</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">Rp {item.price.toLocaleString('id-ID')}</div>

                      <div className="mt-2 flex items-center gap-2">
                        <button aria-label={`Kurangi jumlah ${item.name}`} onClick={()=>updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 bg-gray-100 rounded">-</button>
                        <div className="px-3 py-1 border rounded text-sm">{item.quantity}</div>
                        <button aria-label={`Tambah jumlah ${item.name}`} onClick={()=>updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 bg-gray-100 rounded">+</button>
                        <button aria-label={`Hapus ${item.name}`} onClick={()=>removeFromCart(item.id)} className="ml-2 text-sm text-red-600">Hapus</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between text-sm text-gray-700 mb-3">
              <span>Subtotal</span>
              <span className="font-semibold">Rp {totalPrice.toLocaleString('id-ID')}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={()=>{ /* placeholder for checkout flow */ alert('Checkout belum diimplementasikan') }} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded">Checkout</button>
              <button onClick={clearCart} className="px-3 py-2 border rounded">Kosongkan</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
