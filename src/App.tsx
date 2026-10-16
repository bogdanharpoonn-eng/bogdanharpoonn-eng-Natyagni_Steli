import { OrderDetailScreen } from '@/features/orders/OrderDetailScreen'
import { OrdersListScreen } from '@/features/orders/OrdersListScreen'
import { RoomScreen } from '@/features/room/RoomScreen'
import { useNavStore } from '@/stores/navStore'

export default function App() {
  const screen = useNavStore((s) => s.screen)

  if (screen.name === 'order') {
    return <OrderDetailScreen orderId={screen.orderId} />
  }
  if (screen.name === 'room') {
    return <RoomScreen orderId={screen.orderId} roomId={screen.roomId} />
  }
  return <OrdersListScreen />
}
