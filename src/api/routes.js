// Mock API routes for the Ford Commercial Upfit Configurator

import chassisData from '../data/chassis.json'
import bodiesData from '../data/bodies.json'
import optionsData from '../data/options.json'
import upfittersData from '../data/upfitters.json'
import incentivesData from '../data/incentives.json'

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// GET /api/chassis
export const getChassis = async (series = null) => {
  await delay(100)
  if (series) {
    return chassisData.chassis.find(c => c.series === series) || null
  }
  return chassisData.chassis
}

// GET /api/bodies
export const getBodies = async (bodyType = null) => {
  await delay(100)
  if (bodyType) {
    return bodiesData.bodyTypes[bodyType] || null
  }
  return bodiesData.bodyTypes
}

// GET /api/options
export const getOptions = async () => {
  await delay(100)
  return optionsData
}

// GET /api/upfitters
export const getUpfitters = async (params = {}) => {
  await delay(200)
  let filtered = [...upfittersData.upfitters]
  
  // Filter by location/radius if provided
  if (params.lat && params.lng && params.radius) {
    const { lat, lng, radius } = params
    filtered = filtered.filter(upfitter => {
      const distance = getDistance(lat, lng, upfitter.lat, upfitter.lng)
      return distance <= radius
    })
  }
  
  // Filter by certifications
  if (params.certs) {
    const certsArray = params.certs.split(',')
    filtered = filtered.filter(upfitter => 
      certsArray.every(cert => upfitter.certifications.includes(cert))
    )
  }
  
  // Filter by EV ready
  if (params.evReady === 'true') {
    filtered = filtered.filter(upfitter => upfitter.evReady)
  }
  
  // Sort by distance if location provided
  if (params.lat && params.lng) {
    filtered.sort((a, b) => {
      const distA = getDistance(params.lat, params.lng, a.lat, a.lng)
      const distB = getDistance(params.lat, params.lng, b.lat, b.lng)
      return distA - distB
    })
  }
  
  return filtered
}

// GET /api/incentives
export const getIncentives = async (filters = {}) => {
  await delay(100)
  let filtered = [...incentivesData.incentives]
  
  // Filter by powertrain
  if (filters.powertrain) {
    filtered = filtered.filter(incentive => {
      if (!incentive.conditions.powertrain) return true
      return incentive.conditions.powertrain.includes(filters.powertrain)
    })
  }
  
  // Filter by state
  if (filters.state) {
    filtered = filtered.filter(incentive => {
      if (!incentive.conditions.states) return true
      return incentive.conditions.states.includes(filters.state)
    })
  }
  
  // Filter by series
  if (filters.series) {
    filtered = filtered.filter(incentive => {
      if (!incentive.conditions.series) return true
      return incentive.conditions.series.includes(filters.series)
    })
  }
  
  // Filter by body type
  if (filters.bodyType) {
    filtered = filtered.filter(incentive => {
      if (!incentive.conditions.bodyTypes) return true
      return incentive.conditions.bodyTypes.includes(filters.bodyType)
    })
  }
  
  return {
    incentives: filtered,
    financing: incentivesData.financing
  }
}

// POST /api/orders
export const submitOrder = async (orderData) => {
  await delay(500)
  
  // Validate required fields
  const required = ['chassis', 'bodyType', 'bodyManufacturer', 'upfitter', 'totalPrice']
  for (const field of required) {
    if (!orderData[field]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  
  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  
  // In a real app, this would save to a database
  const order = {
    orderNumber,
    ...orderData,
    status: 'submitted',
    createdAt: new Date().toISOString()
  }
  
  // Store in localStorage for demo purposes
  const orders = JSON.parse(localStorage.getItem('orders') || '[]')
  orders.push(order)
  localStorage.setItem('orders', JSON.stringify(orders))
  
  return order
}

// Helper function to calculate distance between coordinates
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 3959 // Radius of the Earth in miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function toRad(deg) {
  return deg * (Math.PI/180)
}

// Export PDF quote (stub - would use a real PDF library in production)
export const exportPDFQuote = async (buildData) => {
  await delay(200)
  // Build a basic HTML document and render as a PDF using the browser print-to-PDF
  const logoPath = new URL('../assets/FordProLogo.webp', import.meta.url).href
  const bodySpecEntries = Object.entries(buildData.bodySpecs || {})
  const bodySpecsHtml = bodySpecEntries.length
    ? bodySpecEntries.map(([k, v]) => {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
        return `<div class="row"><span>${label}</span><span>${String(v)}</span></div>`
      }).join('')
    : '<div class="muted">No body specifications selected.</div>'

  const p = buildData.pricing || {}
  const freight = Math.round(p.freight ?? 1500)
  const taxes = Math.round(p.taxes ?? 0)
  const fmt = (n) => `$${Math.round(n || 0).toLocaleString()}`
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Ford Commercial Vehicle Quote</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color:#111827; }
        h1 { font-size: 22px; margin: 8px 0 8px 0; }
        h2 { font-size: 16px; margin: 16px 0 6px; }
        .row { display:flex; justify-content: space-between; margin: 4px 0; }
        .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin: 10px 0; }
        .tot { font-weight: 700; font-size: 18px; }
        .muted { color:#6b7280 }
        .header { display:flex; align-items:center; justify-content: space-between; gap:12px; }
        .logo { height:64px; width:auto; object-fit:contain; }
        .amount { min-width: 140px; text-align: right; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Ford Commercial Vehicle Quote</h1>
        <img class="logo" src="${logoPath}" alt="Ford Pro Logo" />
      </div>
      <div class="muted">Date: ${new Date().toLocaleDateString()}</div>
      <div class="muted">Quote #: ${Date.now()}</div>

      <div class="card">
        <h2>Chassis Configuration</h2>
        <div class="row"><span>Series</span><span>${buildData.chassis?.series || '—'}</span></div>
        <div class="row"><span>Cab</span><span>${buildData.chassis?.cab || '—'}</span></div>
        <div class="row"><span>Drivetrain</span><span>${buildData.chassis?.drivetrain || '—'}</span></div>
        <div class="row"><span>Wheelbase</span><span>${buildData.chassis?.wheelbase ? buildData.chassis.wheelbase + '"' : '—'}</span></div>
        <div class="row"><span>Powertrain</span><span>${buildData.chassis?.powertrain || '—'}</span></div>
      </div>

      <div class="card">
        <h2>Body Configuration</h2>
        <div class="row"><span>Body Type</span><span>${buildData.bodyType || '—'}</span></div>
        <div class="row"><span>Manufacturer</span><span>${buildData.bodyManufacturer || '—'}</span></div>
        ${bodySpecsHtml}
      </div>

      <div class="card">
        <h2>Upfitter</h2>
        <div>${buildData.upfitter?.name || ''}</div>
        <div>${buildData.upfitter?.address || ''}</div>
        <div>Lead Time: ${buildData.upfitter?.leadTime || ''}</div>
      </div>

      <div class="card">
        <h2>Pricing</h2>
        <div class="row"><span>Chassis MSRP</span><span class="amount">${fmt(p.chassisMSRP)}</span></div>
        <div class="row"><span>Body & Equipment</span><span class="amount">${fmt(p.bodyPrice)}</span></div>
        <div class="row"><span>Options</span><span class="amount">${fmt(p.optionsPrice)}</span></div>
        <div class="row"><span>Labor/Install</span><span class="amount">${fmt(p.laborPrice)}</span></div>
        <div class="row"><span>Freight & Delivery</span><span class="amount">${fmt(freight)}</span></div>
        <div class="row"><span>Subtotal</span><span class="amount">${fmt(p.subtotal)}</span></div>
        <div class="row"><span>Incentives</span><span class="amount">-${fmt(p.totalIncentives)}</span></div>
        <div class="row"><span>Estimated Taxes (8.75%)</span><span class="amount">${fmt(taxes)}</span></div>
        <div class="row tot"><span>Estimated Total</span><span class="amount">${fmt(p.total)}</span></div>
      </div>
      <script>
        window.onload = () => {
          window.print();
          setTimeout(() => window.close(), 500);
        };
      </script>
    </body>
  </html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  return { success: !!win, filename: 'Ford_Quote.pdf' }
}

// Email quote to dealer/upfitter (stub)
export const emailQuote = async (buildData, recipient) => {
  await delay(300)
  
  // In production, this would call a real email service
  console.log(`Emailing quote to ${recipient}:`, buildData)
  
  return {
    success: true,
    message: `Quote sent to ${recipient}`
  }
}

// Get geocoding for ZIP codes (mock)
export const geocodeZIP = async (zip) => {
  await delay(100)
  
  // Mock geocoding - in production would use Google Maps or similar
  const mockCoordinates = {
    '48201': { lat: 42.3314, lng: -83.0458, city: 'Detroit', state: 'MI' },
    '60601': { lat: 41.8781, lng: -87.6298, city: 'Chicago', state: 'IL' },
    '30301': { lat: 33.7490, lng: -84.3880, city: 'Atlanta', state: 'GA' },
    '10001': { lat: 40.7128, lng: -74.0060, city: 'New York', state: 'NY' },
    '90001': { lat: 34.0522, lng: -118.2437, city: 'Los Angeles', state: 'CA' },
    '75201': { lat: 32.7767, lng: -96.7970, city: 'Dallas', state: 'TX' },
    '85001': { lat: 33.4484, lng: -112.0740, city: 'Phoenix', state: 'AZ' },
    '80201': { lat: 39.7392, lng: -104.9903, city: 'Denver', state: 'CO' },
    '98101': { lat: 47.6062, lng: -122.3321, city: 'Seattle', state: 'WA' },
    '33101': { lat: 25.7617, lng: -80.1918, city: 'Miami', state: 'FL' }
  }
  
  const coords = mockCoordinates[zip]
  if (coords) {
    return coords
  }
  
  // Default to center of USA if ZIP not found
  return {
    lat: 39.8283,
    lng: -98.5795,
    city: 'Unknown',
    state: 'US'
  }
}
