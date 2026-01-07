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
  cartOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addToCart: (item: { id: string; name: string; price: number; image?: string | null }) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, q: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

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

  const openCart = () => setCartOpen(true)
  const closeCart = () => setCartOpen(false)
  const toggleCart = () => setCartOpen((s) => !s)

  const addToCart = (item: { id: string; name: string; price: number; image?: string | null }) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx].quantity += 1
        return copy
      }
      // open cart when adding
      setCartOpen(true)
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }

  const updateQuantity = (id: string, q: number) => {
    setItems((prev) => prev.map(p => p.id === id ? { ...p, quantity: Math.max(1, q) } : p))
  }

  const clearCart = () => setItems([])

  const totalCount = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, totalCount, totalPrice, cartOpen, openCart, closeCart, toggleCart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
