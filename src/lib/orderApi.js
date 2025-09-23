// Minimal client for Order Management API now served by the Vite dev/preview middleware
// Always use relative paths so the same origin Vite server handles requests.
const API_BASE = ''

async function http(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed: ${res.status}`)
  }
  // Some endpoints may return empty bodies
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return res.json()
  return null
}

export async function intakeOrder(payload) {
  return http('/api/orders/intake', { method: 'POST', body: JSON.stringify(payload) })
}

export async function getOrders(params = {}) {
  const usp = new URLSearchParams()
  if (params.status) usp.set('status', params.status)
  if (params.q) usp.set('q', params.q)
  if (params.stock != null) usp.set('stock', String(params.stock))
  if (params.from) usp.set('from', params.from)
  if (params.to) usp.set('to', params.to)
  return http(`/api/orders?${usp.toString()}`, { method: 'GET' })
}

export async function getOrder(id) {
  return http(`/api/orders/${encodeURIComponent(id)}`, { method: 'GET' })
}

export async function advanceOrder(id, to) {
  return http(`/api/orders/${encodeURIComponent(id)}/transition`, {
    method: 'POST',
    body: JSON.stringify({ to })
  })
}

export async function updateEtas(id, payload) {
  return http(`/api/orders/${encodeURIComponent(id)}/etas`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}

export async function publishListing(id) {
  return http(`/api/listings/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
    body: JSON.stringify({ channel: 'DEALER_WEBSITE' })
  })
}


