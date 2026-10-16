import { Suspense, lazy } from 'react'
import { useNavStore } from '@/stores/navStore'
import { uk } from '@/i18n/uk'

const OrdersListScreen = lazy(() =>
  import('@/features/orders/OrdersListScreen').then((m) => ({ default: m.OrdersListScreen })),
)
const OrderDetailScreen = lazy(() =>
  import('@/features/orders/OrderDetailScreen').then((m) => ({ default: m.OrderDetailScreen })),
)
const RoomScreen = lazy(() =>
  import('@/features/room/RoomScreen').then((m) => ({ default: m.RoomScreen })),
)
const SettingsScreen = lazy(() =>
  import('@/features/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
)

function ScreenFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center theme-bg theme-text">
      <p className="text-sm theme-muted">{uk.ordersLoading}</p>
    </div>
  )
}

export default function App() {
  const screen = useNavStore((s) => s.screen)

  let content = <OrdersListScreen />
  if (screen.name === 'settings') {
    content = <SettingsScreen />
  } else if (screen.name === 'order') {
    content = <OrderDetailScreen orderId={screen.orderId} />
  } else if (screen.name === 'room') {
    content = <RoomScreen orderId={screen.orderId} roomId={screen.roomId} />
  }

  return <Suspense fallback={<ScreenFallback />}>{content}</Suspense>
}
