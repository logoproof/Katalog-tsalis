'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image?: string | null
}

type CartContextType = {
  items: CartItem[]
  totalCount: number
  totalPrice: number
  addToCart: (item: { id: string; name: string; price: number; image?: string | null }) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, q: number) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart')
      if (raw) setItems(JSON.parse(raw))
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addToCart = (item: { id: string; name: string; price: number; image?: string | null }) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx].quantity += 1
        return copy
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }

  const updateQuantity = (id: string, q: number) => {
    setItems((prev) => prev.map(p => p.id === id ? { ...p, quantity: q } : p))
  }

  const totalCount = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, totalCount, totalPrice, addToCart, removeFromCart, updateQuantity }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
