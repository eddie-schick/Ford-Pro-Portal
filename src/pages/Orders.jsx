import { useEffect, useMemo, useState } from 'react'
import { getOrders } from '@/lib/orderApi'

export function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [stockOnly, setStockOnly] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await getOrders({ status, q, stock: stockOnly })
        setOrders(data?.orders || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [status, q, stockOnly])

  const metrics = useMemo(() => {
    const open = orders.filter((o) => (
      [ 'CONFIG_RECEIVED','OEM_ALLOCATED','OEM_PRODUCTION','OEM_IN_TRANSIT','AT_UPFITTER','UPFIT_IN_PROGRESS','READY_FOR_DELIVERY' ].includes(o.status)
    )).length
    const atOem = orders.filter((o) => [ 'OEM_ALLOCATED','OEM_PRODUCTION','OEM_IN_TRANSIT' ].includes(o.status)).length
    const atUpfitter = orders.filter((o) => [ 'AT_UPFITTER','UPFIT_IN_PROGRESS' ].includes(o.status)).length
    const overdue = orders.filter((o) => {
      const eta = o.deliveryEta || o.upfitterEta || o.oemEta
      return eta && new Date(eta) < new Date() && o.status !== 'DELIVERED' && o.status !== 'CANCELED'
    }).length
    return { open, atOem, atUpfitter, overdue }
  }, [orders])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Orders</h1>

      <form className="flex flex-wrap gap-3 items-end mb-4" aria-label="Order filters">
        <label className="text-sm">
          <span className="block mb-1">Status</span>
          <select className="border rounded px-2 py-1" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All</option>
            <option value="CONFIG_RECEIVED">CONFIG_RECEIVED</option>
            <option value="OEM_ALLOCATED">OEM_ALLOCATED</option>
            <option value="OEM_PRODUCTION">OEM_PRODUCTION</option>
            <option value="OEM_IN_TRANSIT">OEM_IN_TRANSIT</option>
            <option value="AT_UPFITTER">AT_UPFITTER</option>
            <option value="UPFIT_IN_PROGRESS">UPFIT_IN_PROGRESS</option>
            <option value="READY_FOR_DELIVERY">READY_FOR_DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELED">CANCELED</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="block mb-1">Search</span>
          <input className="border rounded px-2 py-1" placeholder="Order ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search by order id" />
        </label>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={stockOnly} onChange={(e) => setStockOnly(e.target.checked)} aria-label="Stock only" />
          Stock only
        </label>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4" role="region" aria-label="Order metrics">
        <div className="rounded-md border p-3" tabIndex={0}><div className="text-xs text-gray-500">Open</div><div className="text-xl font-semibold">{metrics.open}</div></div>
        <div className="rounded-md border p-3" tabIndex={0}><div className="text-xs text-gray-500">At OEM</div><div className="text-xl font-semibold">{metrics.atOem}</div></div>
        <div className="rounded-md border p-3" tabIndex={0}><div className="text-xs text-gray-500">At Upfitter</div><div className="text-xl font-semibold">{metrics.atUpfitter}</div></div>
        <div className="rounded-md border p-3" tabIndex={0}><div className="text-xs text-gray-500">Overdue</div><div className="text-xl font-semibold">{metrics.overdue}</div></div>
      </div>

      <div className="overflow-x-auto bg-white border rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4 pl-4">Order ID</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Dealer</th>
              <th className="py-2 pr-4">Upfitter</th>
              <th className="py-2 pr-4">OEM ETA</th>
              <th className="py-2 pr-4">Upfitter ETA</th>
              <th className="py-2 pr-4">Final ETA</th>
              <th className="py-2 pr-4">Stock?</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="py-4" colSpan={9}>Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td className="py-4" colSpan={9}>No orders</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-4 pl-4"><a className="text-blue-600 underline" href={`/ordermanagement/${o.id}`}>{o.id}</a></td>
                  <td className="py-2 pr-4"><span className="inline-block text-xs px-2 py-1 rounded-full border">{o.status}</span></td>
                  <td className="py-2 pr-4">{o.dealerCode}</td>
                  <td className="py-2 pr-4">{o.buildJson?.upfitter?.name ?? '-'}</td>
                  <td className="py-2 pr-4">{o.oemEta ? new Date(o.oemEta).toLocaleDateString() : '-'}</td>
                  <td className="py-2 pr-4">{o.upfitterEta ? new Date(o.upfitterEta).toLocaleDateString() : '-'}</td>
                  <td className="py-2 pr-4">{o.deliveryEta ? new Date(o.deliveryEta).toLocaleDateString() : '-'}</td>
                  <td className="py-2 pr-4">{o.isStock ? 'Yes' : 'No'}</td>
                  <td className="py-2 pr-4"><a className="text-blue-600 underline" href={`/ordermanagement/${o.id}`}>View</a></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


