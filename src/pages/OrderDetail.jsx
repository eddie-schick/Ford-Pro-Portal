import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { advanceOrder, getOrder, publishListing, updateEtas } from '@/lib/orderApi'

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await getOrder(id)
      setOrder(data?.order || null)
      setEvents(data?.events || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) load() }, [id])

  const nextLabel = useMemo(() => {
    const flow = [ 'CONFIG_RECEIVED','OEM_ALLOCATED','OEM_PRODUCTION','OEM_IN_TRANSIT','AT_UPFITTER','UPFIT_IN_PROGRESS','READY_FOR_DELIVERY','DELIVERED' ]
    if (!order) return null
    const idx = flow.indexOf(order.status)
    return flow[idx + 1] || null
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

  if (loading || !order) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">Loading…</div>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
      <button className="text-blue-600 underline" onClick={() => navigate('/ordermanagement')}>Back to Orders</button>
      <h1 className="text-3xl font-bold">Order {order.id}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded p-4">
            <div className="font-semibold mb-2">Build Summary</div>
            <div className="text-sm text-gray-700">
              <div>Body: {order.buildJson?.bodyType} – {order.buildJson?.manufacturer}</div>
              <div>Chassis: {order.buildJson?.chassis?.series} / {order.buildJson?.chassis?.cab} / {order.buildJson?.chassis?.drivetrain} / WB {order.buildJson?.chassis?.wheelbase}" / {order.buildJson?.chassis?.powertrain}</div>
              <div>Upfitter: {order.buildJson?.upfitter?.name || '-'}</div>
            </div>
          </div>

          <div className="border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Status Timeline</div>
              {nextLabel && <button disabled={saving} className="px-3 py-1 rounded bg-black text-white disabled:opacity-50" onClick={doAdvance}>Advance to {nextLabel}</button>}
            </div>
            <ul className="text-sm list-disc pl-5">
              {events.map(e => (
                <li key={e.id}>{e.at} – {e.from || 'START'} → {e.to}</li>
              ))}
            </ul>
          </div>

          <div className="border rounded p-4">
            <div className="font-semibold mb-2">ETA Editor</div>
            <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={(ev) => {
              ev.preventDefault()
              const form = ev.currentTarget
              const payload = {
                oemEta: form.oemEta.value || null,
                upfitterEta: form.upfitterEta.value || null,
                deliveryEta: form.deliveryEta.value || null,
              }
              onUpdateEtas(payload)
            }}>
              <label className="text-sm">OEM ETA<input name="oemEta" type="date" defaultValue={order.oemEta ? order.oemEta.slice(0,10) : ''} className="border rounded px-2 py-1 w-full" /></label>
              <label className="text-sm">Upfitter ETA<input name="upfitterEta" type="date" defaultValue={order.upfitterEta ? order.upfitterEta.slice(0,10) : ''} className="border rounded px-2 py-1 w-full" /></label>
              <label className="text-sm">Final Delivery ETA<input name="deliveryEta" type="date" defaultValue={order.deliveryEta ? order.deliveryEta.slice(0,10) : ''} className="border rounded px-2 py-1 w-full" /></label>
              <div className="md:col-span-3"><button type="submit" disabled={saving} className="px-3 py-1 rounded bg-black text-white disabled:opacity-50">Save ETAs</button></div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded p-4">
            <div className="font-semibold mb-2">Pricing Summary</div>
            <div className="text-sm">
              <div>Chassis MSRP: ${Number(order.pricingJson?.chassisMsrp || 0).toLocaleString()}</div>
              <div>Body: ${Number(order.pricingJson?.bodyPrice || 0).toLocaleString()}</div>
              <div>Options: ${Number(order.pricingJson?.optionsPrice || 0).toLocaleString()}</div>
              <div>Labor: ${Number(order.pricingJson?.labor || 0).toLocaleString()}</div>
              <div>Freight: ${Number(order.pricingJson?.freight || 0).toLocaleString()}</div>
              <div className="font-semibold mt-1">Total: ${Number(order.pricingJson?.total || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="border rounded p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Stock & Publishing</div>
              <button disabled={saving || !order.isStock} className="px-3 py-1 rounded bg-black text-white disabled:opacity-50" onClick={onPublish}>
                {order.listingStatus === 'PUBLISHED' ? 'Published' : 'Mark Stock & Publish'}
              </button>
            </div>
            {!order.isStock && <div className="text-xs text-gray-600 mt-2">Only stock units can be published.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}


