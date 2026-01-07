import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Katalog Tsalis',
  description: 'Katalog produk Tsalis',
}

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { CartProvider } from '@/context/CartContext'
import dynamic from 'next/dynamic'

const CartDrawer = dynamic(() => import('@/components/CartDrawer'), { ssr: false })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <CartProvider>
          <Header />

          <main className="w-full px-4 py-6 flex justify-center">
            <div className="w-full max-w-full sm:max-w-xl md:max-w-2xl lg:w-1/2">
              {children}
            </div>
          </main>

          <Footer />

          {/* Cart drawer mounted globally so it can be opened from anywhere */}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  )
}