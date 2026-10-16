import { useEffect, useState } from 'react'
import { OfflineBadge } from '@/components/OfflineBadge'
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
  const goSettings = useNavStore((s) => s.goSettings)
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    void refreshList()
  }, [refreshList, search])

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const onCreate = async () => {
    const order = await createOrder()
    goOrder(order.id)
  }

  return (
    <div className="theme-page">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-3 py-4 pb-10">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" data-testid="orders-title">
              {uk.ordersTitle}
            </h1>
            <p className="mt-1 text-sm theme-muted">{uk.appTagline}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <OfflineBadge online={online} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={goSettings}
                className="theme-btn-ghost min-h-touch rounded-md px-3 text-sm"
                data-testid="open-settings"
              >
                {uk.settingsTitle}
              </button>
              <button
                type="button"
                onClick={() => void onCreate()}
                className="theme-btn-primary min-h-touch shrink-0 rounded-md px-3 text-sm font-medium"
                data-testid="new-order"
              >
                {uk.ordersNew}
              </button>
            </div>
          </div>
        </header>

        <label className="block">
          <span className="sr-only">{uk.ordersSearch}</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={uk.ordersSearchPlaceholder}
            className="theme-input min-h-touch w-full rounded-md px-3 text-base"
            data-testid="orders-search"
          />
        </label>

        {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
        {loading && orders.length === 0 ? (
          <p className="text-sm theme-muted">{uk.ordersLoading}</p>
        ) : null}

        {orders.length === 0 && !loading ? (
          <p className="theme-card rounded-lg border-dashed px-4 py-8 text-center text-sm theme-muted">
            {uk.ordersEmpty}
          </p>
        ) : (
          <ul className="space-y-2">
            {orders.map((order) => (
              <li key={order.id}>
                <button
                  type="button"
                  onClick={() => goOrder(order.id)}
                  className="theme-card flex min-h-touch w-full flex-col rounded-lg px-3 py-3 text-left"
                  data-testid={`order-${order.id}`}
                >
                  <span className="font-medium">
                    {order.client.name.trim() || uk.orderUntitled}
                  </span>
                  <span className="mt-1 text-sm theme-muted">
                    {[order.client.phone, order.client.address].filter(Boolean).join(' · ') ||
                      uk.orderNoClient}
                  </span>
                  <span className="mt-2 text-xs theme-muted">
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
