import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const serverClient = createClient(SUPABASE_URL, SUPABASE_ANON)

async function getUserFromAuthToken(token?: string | null) {
  if (!token) return null
  try {
    const { data: userData, error } = await serverClient.auth.getUser(token)
    if (error) return null
    return userData.user
  } catch {
    return null
  }
}

async function isUserAdmin(userId: string | null) {
  if (!userId) return false
  const { data: profile } = await serverClient.from('profiles').select('role').eq('id', userId).single()
  return (profile?.role || '') === 'admin'
}

export async function GET(request: Request) {
  // Accept optional Authorization header to detect admin role
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  const user = await getUserFromAuthToken(token)
  const is_admin = user ? await isUserAdmin(user.id) : false

  // fetch packages with package_items aggregation
  const { data, error } = await serverClient
    .from('packages')
    .select('id, name, updated_at, package_items(product_id)')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type PackageRow = { name: string; package_items?: { product_id: string }[]; updated_at?: string }
  const rows = (data || []) as PackageRow[]
  const packages = rows.map((p) => ({ name: p.name, skus: (p.package_items || []).map((pi) => pi.product_id), updated_at: p.updated_at }))
  return NextResponse.json({ packages, is_admin })
}

export async function PUT(request: Request) {
  // update a package; body must be { name, skus: string[] }
  const body = await request.json()
  const { name, skus } = body || {}

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  const user = await getUserFromAuthToken(token)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const is_admin = await isUserAdmin(user.id)
  if (!is_admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  if (!name || !Array.isArray(skus)) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  // ensure package exists
  const { data: pkgRow } = await serverClient.from('packages').select('id').eq('name', name).single()
  let packageId = pkgRow?.id
  if (!packageId) {
    const { data: newPkg } = await serverClient.from('packages').insert({ name }).select('id').single()
    packageId = newPkg?.id
  }

  // replace package_items for this package
  await serverClient.from('package_items').delete().eq('package_id', packageId)

  if (skus.length > 0) {
    const inserts = skus.map((productId: string, i: number) => ({ package_id: packageId, product_id: productId, quantity: 1, position: i }))
    await serverClient.from('package_items').insert(inserts)
  }

  // return updated representation
  const { data: updatedData } = await serverClient
    .from('packages')
    .select('name, package_items(product_id), updated_at')
    .eq('id', packageId)
    .single()

  type UpdatedRow = { name: string; package_items?: { product_id: string }[]; updated_at?: string }
  const updated = updatedData as UpdatedRow
  const pkg = { name: updated.name, skus: (updated.package_items || []).map((pi) => pi.product_id), updated_at: updated.updated_at }
  return NextResponse.json({ package: pkg })
}

export async function PATCH(request: Request) {
  // partial update a package; body can be { name, addSkus?: string[], removeSkus?: string[] }
  const body = await request.json()
  const { name, addSkus, removeSkus } = body || {}

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  const user = await getUserFromAuthToken(token)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const is_admin = await isUserAdmin(user.id)
  if (!is_admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  if (!name) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }

  // get current package
  const { data: pkgRow } = await serverClient.from('packages').select('id').eq('name', name).single()
  if (!pkgRow) return NextResponse.json({ error: 'package not found' }, { status: 404 })
  const packageId = pkgRow.id

  // get current skus
  const { data: currentItems } = await serverClient.from('package_items').select('product_id').eq('package_id', packageId).order('position')
  let currentSkus = (currentItems || []).map((pi: { product_id: string }) => pi.product_id)

  // apply changes
  if (Array.isArray(addSkus)) {
    addSkus.forEach((sku: string) => {
      if (!currentSkus.includes(sku)) {
        currentSkus.push(sku)
      }
    })
  }
  if (Array.isArray(removeSkus)) {
    currentSkus = currentSkus.filter((sku: string) => !removeSkus.includes(sku))
  }

  // update package_items
  await serverClient.from('package_items').delete().eq('package_id', packageId)
  if (currentSkus.length > 0) {
    const inserts = currentSkus.map((productId: string, i: number) => ({ package_id: packageId, product_id: productId, quantity: 1, position: i }))
    await serverClient.from('package_items').insert(inserts)
  }

  // return updated representation
  const { data: updatedData } = await serverClient
    .from('packages')
    .select('name, package_items(product_id), updated_at')
    .eq('id', packageId)
    .single()

  type UpdatedRow = { name: string; package_items?: { product_id: string }[]; updated_at?: string }
  const updated = updatedData as UpdatedRow
  const pkg = { name: updated.name, skus: (updated.package_items || []).map((pi) => pi.product_id), updated_at: updated.updated_at }
  return NextResponse.json({ package: pkg })
}
