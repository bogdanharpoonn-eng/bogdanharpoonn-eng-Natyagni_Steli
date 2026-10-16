import { useEffect } from 'react'
import { useNavStore } from '@/stores/navStore'
import { useOrdersStore } from '@/stores/ordersStore'
import { uk } from '@/i18n/uk'

function statusText(status: string): string {
  if (status === 'done') return uk.orderStatusDone
  if (status === 'sent') return uk.orderStatusSent
  return uk.orderStatusDraft
}

export function OrdersListScreen() {
  const orders = useOrdersStore((s) => s.orders)
  const search = useOrdersStore((s) => s.search)
  const loading = useOrdersStore((s) => s.loading)
  const error = useOrdersStore((s) => s.error)
  const setSearch = useOrdersStore((s) => s.setSearch)
  const refreshList = useOrdersStore((s) => s.refreshList)
  const createOrder = useOrdersStore((s) => s.createOrder)
  const goOrder = useNavStore((s) => s.goOrder)

  useEffect(() => {
    void refreshList()
  }, [refreshList, search])

  const onCreate = async () => {
    const order = await createOrder()
    goOrder(order.id)
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-3 py-4 pb-10">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{uk.ordersTitle}</h1>
            <p className="mt-1 text-sm text-slate-400">{uk.appTagline}</p>
          </div>
          <button
            type="button"
            onClick={() => void onCreate()}
            className="min-h-touch shrink-0 rounded-md bg-sky-600 px-3 text-sm font-medium text-white"
          >
            {uk.ordersNew}
          </button>
        </header>

        <label className="block">
          <span className="sr-only">{uk.ordersSearch}</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={uk.ordersSearchPlaceholder}
            className="min-h-touch w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-base outline-none ring-sky-500 focus:ring-2"
          />
        </label>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {loading && orders.length === 0 ? (
          <p className="text-sm text-slate-400">{uk.ordersLoading}</p>
        ) : null}

        {orders.length === 0 && !loading ? (
          <p className="rounded-lg border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-400">
            {uk.ordersEmpty}
          </p>
        ) : (
          <ul className="space-y-2">
            {orders.map((order) => (
              <li key={order.id}>
                <button
                  type="button"
                  onClick={() => goOrder(order.id)}
                  className="flex min-h-touch w-full flex-col rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-left"
                >
                  <span className="font-medium text-slate-50">
                    {order.client.name.trim() || uk.orderUntitled}
                  </span>
                  <span className="mt-1 text-sm text-slate-400">
                    {[order.client.phone, order.client.address].filter(Boolean).join(' · ') ||
                      uk.orderNoClient}
                  </span>
                  <span className="mt-2 text-xs text-slate-500">
                    {statusText(order.status)} · {order.rooms.length} {uk.ordersRoomsCount}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
