import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { advanceOrder, getOrder, publishListing, updateEtas, cancelOrder, setStock, getNotes, addNote, getStatusLabel, setInventoryStatus, ensureDemoOrder } from '@/lib/orderApi'

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [events, setEvents] = useState([])
  const [notes, setNotes] = useState([])
  const [noteText, setNoteText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEtaEditor, setShowEtaEditor] = useState(false)
  const [role, setRole] = useState('INTERNAL')
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [messageTo, setMessageTo] = useState('Dealer')

  const FLOW = [ 'CONFIG_RECEIVED','OEM_ALLOCATED','OEM_PRODUCTION','OEM_IN_TRANSIT','AT_UPFITTER','UPFIT_IN_PROGRESS','READY_FOR_DELIVERY','DELIVERED' ]

  async function load() {
    setLoading(true)
    try {
      let data = await getOrder(id)
      if (!data?.order) {
        // As a fallback for deep links, explicitly create a stub order and use it immediately
        data = await ensureDemoOrder(id)
      }
      let resolved = data?.order
      if (!resolved) {
        // Final safety: build an in-memory stub so the page always renders
        const now = new Date().toISOString()
        resolved = {
          id: String(id),
          dealerCode: 'CVC101',
          upfitterId: 'knapheide-detroit',
          status: 'OEM_ALLOCATED',
          oemEta: new Date(Date.now() + 10 * 86400000).toISOString(),
          upfitterEta: new Date(Date.now() + 20 * 86400000).toISOString(),
          deliveryEta: new Date(Date.now() + 35 * 86400000).toISOString(),
          buildJson: {
            bodyType: 'Service Body',
            manufacturer: 'Knapheide',
            chassis: { series: 'F-550', cab: 'Crew Cab', drivetrain: '4x4', wheelbase: '169', gvwr: '19500', powertrain: 'diesel-6.7L' },
            bodySpecs: { bodyLength: 11, material: 'Steel' },
            upfitter: { id: 'knapheide-detroit', name: 'Knapheide Detroit' },
          },
          pricingJson: { chassisMsrp: 64000, bodyPrice: 21000, optionsPrice: 2500, labor: 3800, freight: 1500, incentives: [], taxes: 0, total: 91800 },
          inventoryStatus: 'STOCK',
          isStock: true,
          buyerName: '',
          listingStatus: null,
          dealerWebsiteStatus: 'DRAFT',
          createdAt: now,
          updatedAt: now,
          stockNumber: '',
          vin: '',
        }
      }
      setOrder(resolved)
      setEvents(data?.events || [])
      const ns = await getNotes(id)
      setNotes(ns || [])
      try {
        const raw = localStorage.getItem(`LS_MSGS_${id}`)
        setMessages(Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : (raw ? [] : []))
      } catch {
        setMessages([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) load() }, [id])

  // Load or create the order on id change
  useEffect(() => { if (id) load() }, [id])

  useEffect(() => {
    const r = (localStorage.getItem('role') || 'INTERNAL').toUpperCase()
    setRole(r === 'BUYER' ? 'BUYER' : 'INTERNAL')
  }, [])

  const nextLabel = useMemo(() => {
    if (!order) return null
    const idx = FLOW.indexOf(order.status)
    return FLOW[idx + 1] || null
  }, [order])

  const doAdvance = async () => {
    if (!nextLabel) return
    setSaving(true)
    try {
      await advanceOrder(id, nextLabel)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const onCancel = async () => {
    setSaving(true)
    try {
      await cancelOrder(id)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const onUpdateEtas = async (payload) => {
    setSaving(true)
    try {
      await updateEtas(id, payload)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const onPublish = async () => {
    setSaving(true)
    try {
      await publishListing(id)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const onSetStock = async (checked) => {
    setSaving(true)
    try {
      await setStock(id, checked)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const onAddNote = async (ev) => {
    ev.preventDefault()
    if (!noteText.trim()) return
    setSaving(true)
    try {
      await addNote(id, noteText.trim())
      setNoteText('')
      await load()
    } finally {
      setSaving(false)
    }
  }

  const onSendMessage = (ev) => {
    ev.preventDefault()
    if (!messageText.trim()) return
    const next = [{ id: `msg_${Date.now()}`, to: messageTo, text: messageText.trim(), at: new Date().toISOString(), user: 'You' }, ...messages]
    setMessages(next)
    setMessageText('')
    try { localStorage.setItem(`LS_MSGS_${id}`, JSON.stringify(next)) } catch {}
  }

  if (loading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">Loading…</div>
  if (!order) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="border rounded p-6 bg-white text-center space-y-3">
        <div className="text-xl font-semibold">Order not found</div>
        <div className="text-sm text-gray-600">The order you are trying to view does not exist or has expired from demo data.</div>
        <div><button className="px-3 py-1 rounded bg-black text-white" onClick={() => navigate('/ordermanagement')}>Back to Orders</button></div>
      </div>
    </div>
  )

  const canEditEta = role === 'INTERNAL'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-gray-50/80 backdrop-blur border-b">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-gray-500">Order</div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold truncate">{order.id}</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">{getStatusLabel(order.status)}</span>
              {order.vin ? <span className="text-xs text-gray-600">VIN {order.vin}</span> : null}
              {order.stockNumber ? <span className="text-xs text-gray-600">Stock {order.stockNumber}</span> : null}
            </div>
          </div>
          <div className="flex items-center gap-2"></div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Build Summary - expanded */}
          <section className="border rounded p-4 bg-white">
            <div className="font-semibold mb-3">Build Summary</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <div className="text-xs text-gray-500 uppercase">Body</div>
                <div>{order.buildJson?.bodyType || '-'} {order.buildJson?.manufacturer ? `— ${order.buildJson.manufacturer}` : ''}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Upfitter</div>
                <div>{order.buildJson?.upfitter?.name || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Series / Cab / Drivetrain</div>
                <div>{order.buildJson?.chassis?.series || '-'} / {order.buildJson?.chassis?.cab || '-'} / {order.buildJson?.chassis?.drivetrain || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Wheelbase / GVWR / Powertrain</div>
                <div>WB {order.buildJson?.chassis?.wheelbase || '-'}{order.buildJson?.chassis?.wheelbase ? '"' : ''} / {order.buildJson?.chassis?.gvwr || '-'} / {order.buildJson?.chassis?.powertrain || '-'}</div>
              </div>
            </div>
            {/* Catalog link placeholder */}
            <div className="mt-3 text-xs"><a className="text-blue-600 underline" href="#">View in Catalog</a></div>
          </section>

          {/* Status timeline */}
          <section className="border rounded p-4 bg-white">
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="font-semibold">Status Timeline</div>
              <div className="flex items-center gap-2">
                {canEditEta ? (
                  <button className="px-2 py-1 text-xs rounded border" onClick={() => setShowEtaEditor(true)}>Edit ETAs</button>
                ) : (
                  <span className="text-xs text-gray-500">ETAs are read-only</span>
                )}
              </div>
            </div>
            <ol className="flex flex-wrap gap-2 text-xs">
              {FLOW.map((s, i) => {
                const current = order.status === s
                const past = FLOW.indexOf(order.status) > i
                const cls = current ? 'bg-blue-600 text-white' : past ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'
                return (
                  <li key={s} className={`px-2 py-1 rounded ${cls}`}>{getStatusLabel(s)}</li>
                )
              })}
            </ol>
            <ul className="text-sm list-disc pl-5 mt-3">
              {events.map(e => (
                <li key={e.id}>{new Date(e.at).toLocaleString()} – {e.from || 'START'} → {e.to}</li>
              ))}
            </ul>
          </section>

          {/* Notes */}
          <section className="border rounded p-4 bg-white">
            <div className="font-semibold mb-2">Notes</div>
            <ul className="text-sm space-y-1 max-h-56 overflow-auto">
              {notes.length === 0 ? <li className="text-gray-600">No notes yet.</li> : notes.map(n => (
                <li key={n.id}><span className="text-gray-500 mr-2">{new Date(n.at).toLocaleString()}</span>{n.text} <span className="text-gray-500">— {n.user}</span></li>
              ))}
            </ul>
            <form className="mt-3 flex gap-2" onSubmit={onAddNote}>
              <input className="border rounded px-2 py-1 flex-1" placeholder="Add a note…" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <button type="submit" disabled={saving || !noteText.trim()} className="px-3 py-1 rounded bg-black text-white disabled:opacity-50">Add Note</button>
            </form>
          </section>

          {/* Messaging */}
          <section className="border rounded p-4 bg-white">
            <div className="font-semibold mb-2">Messaging</div>
            <ul className="text-sm space-y-1 max-h-56 overflow-auto">
              {messages.length === 0 ? <li className="text-gray-600">No messages yet.</li> : messages.map(m => (
                <li key={m.id}><span className="text-gray-500 mr-2">{new Date(m.at).toLocaleString()}</span><span className="font-medium">To {m.to}:</span> {m.text} <span className="text-gray-500">— {m.user}</span></li>
              ))}
            </ul>
            <form className="mt-3 flex flex-col sm:flex-row gap-2" onSubmit={onSendMessage}>
              <select className="border rounded px-2 py-1" value={messageTo} onChange={(e) => setMessageTo(e.target.value)}>
                <option>OEM</option>
                <option>Upfitter</option>
                <option>Dealer</option>
                <option>Buyer</option>
              </select>
              <input className="border rounded px-2 py-1 flex-1" placeholder="Type a message…" value={messageText} onChange={(e) => setMessageText(e.target.value)} />
              <button type="submit" className="px-3 py-1 rounded bg-black text-white disabled:opacity-50" disabled={!messageText.trim()}>Send</button>
            </form>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Sales Status */}
          <section className="border rounded p-4 bg-white">
            <div className="font-semibold mb-2">Sales Status</div>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <select
                  className="border rounded px-2 py-1"
                  defaultValue={order.inventoryStatus || (order.isStock ? 'STOCK' : 'SOLD')}
                  onChange={async (e) => {
                    const next = e.target.value
                    const buyer = next === 'SOLD' ? (prompt('Buyer name (optional):', order.buyerName || '') || '') : ''
                    try {
                      await setInventoryStatus(order.id, next, buyer)
                      await load()
                    } catch (err) {
                      console.error(err)
                      alert('Failed to update sales status')
                    }
                  }}
                >
                  <option value="STOCK">Stock</option>
                  <option value="SOLD">Sold</option>
                </select>
                <span className="text-xs text-gray-600">{order.buyerName ? `(Buyer: ${order.buyerName})` : ''}</span>
              </div>
            </div>
          </section>
          {/* Order header summary */}
          <section className="border rounded p-4 bg-white">
            <div className="font-semibold mb-2">Summary</div>
            <div className="text-sm space-y-1">
              <div><span className="text-gray-600">Dealer:</span> {order.dealerCode || '-'}</div>
              <div><span className="text-gray-600">Upfitter:</span> {order.buildJson?.upfitter?.name || '-'}</div>
              <div><span className="text-gray-600">OEM ETA:</span> {order.oemEta ? new Date(order.oemEta).toLocaleDateString() : '-'}</div>
              <div><span className="text-gray-600">Upfitter ETA:</span> {order.upfitterEta ? new Date(order.upfitterEta).toLocaleDateString() : '-'}</div>
              <div><span className="text-gray-600">Final ETA:</span> {order.deliveryEta ? new Date(order.deliveryEta).toLocaleDateString() : '-'}</div>
            </div>
          </section>

          <section className="border rounded p-4 bg-white">
            <div className="font-semibold mb-2">Pricing Summary</div>
            <div className="text-sm">
              <div>Chassis MSRP: ${Number(order.pricingJson?.chassisMsrp || 0).toLocaleString()}</div>
              <div>Body: ${Number(order.pricingJson?.bodyPrice || 0).toLocaleString()}</div>
              <div>Options: ${Number(order.pricingJson?.optionsPrice || 0).toLocaleString()}</div>
              <div>Labor: ${Number(order.pricingJson?.labor || 0).toLocaleString()}</div>
              <div>Freight: ${Number(order.pricingJson?.freight || 0).toLocaleString()}</div>
              <div className="font-semibold mt-1">Total: ${Number(order.pricingJson?.total || 0).toLocaleString()}</div>
            </div>
          </section>

          <section className="border rounded p-4 bg-white">
            <div className="font-semibold mb-2">Stock & Publishing</div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={!!order.isStock} onChange={(e) => onSetStock(e.target.checked)} />
                Mark as Stock
              </label>
              <button disabled={saving || !order.isStock} className="px-3 py-1 rounded bg-black text-white disabled:opacity-50" onClick={onPublish}>
                {order.dealerWebsiteStatus === 'PUBLISHED' ? 'Published' : 'Publish to Dealer Website'}
              </button>
            </div>
            {!order.isStock && <div className="text-xs text-gray-600 mt-2">Only stock units can be published.</div>}
          </section>

          <section className="border rounded p-4 bg-white">
            <div className="font-semibold mb-2">Stakeholders</div>
            <div className="text-sm space-y-1">
              <div><span className="text-gray-600">OEM:</span> Ford</div>
              <div><span className="text-gray-600">Dealer:</span> {order.dealerCode || '-'}</div>
              <div><span className="text-gray-600">Logistics:</span> —</div>
              <div><span className="text-gray-600">Buyer:</span> {order.buyerName || (order.isStock ? 'N/A (Stock)' : '-')}</div>
          </div>
          </section>

          <section className="border rounded p-4 bg-white">
            <div className="font-semibold mb-2">Quick Links</div>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li><a className="text-blue-600 underline" href="/ordermanagement">Orders</a></li>
              <li><a className="text-blue-600 underline" href="/configure">Start New Build</a></li>
              {canEditEta && <li><button className="text-blue-600 underline" onClick={() => setShowEtaEditor(true)}>Edit ETAs</button></li>}
            </ul>
          </section>
        </aside>
      </div>

      {/* ETA modal (simple inline) */}
      {showEtaEditor && canEditEta && (
        <div className="fixed inset-0 z-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEtaEditor(false)}></div>
          <div className="relative bg-white rounded shadow-lg w-full max-w-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Edit ETAs</div>
              <button className="text-sm" onClick={() => setShowEtaEditor(false)}>Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="text-sm">OEM ETA<input name="oemEta" id="eta_oem" type="date" defaultValue={order.oemEta ? order.oemEta.slice(0,10) : ''} className="border rounded px-2 py-1 w-full" /></label>
              <label className="text-sm">Upfitter ETA<input name="upfitterEta" id="eta_upfitter" type="date" defaultValue={order.upfitterEta ? order.upfitterEta.slice(0,10) : ''} className="border rounded px-2 py-1 w-full" /></label>
              <label className="text-sm">Final Delivery ETA<input name="deliveryEta" id="eta_delivery" type="date" defaultValue={order.deliveryEta ? order.deliveryEta.slice(0,10) : ''} className="border rounded px-2 py-1 w-full" /></label>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button className="px-3 py-1 rounded border" onClick={() => setShowEtaEditor(false)}>Cancel</button>
              <button disabled={saving} className="px-3 py-1 rounded bg-black text-white disabled:opacity-50" onClick={async () => {
                const payload = {
                  oemEta: document.getElementById('eta_oem').value || null,
                  upfitterEta: document.getElementById('eta_upfitter').value || null,
                  deliveryEta: document.getElementById('eta_delivery').value || null,
                }
                await onUpdateEtas(payload)
                setShowEtaEditor(false)
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


