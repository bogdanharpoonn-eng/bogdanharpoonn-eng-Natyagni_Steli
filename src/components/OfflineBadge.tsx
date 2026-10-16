import { uk } from '@/i18n/uk'

interface OfflineBadgeProps {
  online: boolean
}

export function OfflineBadge({ online }: OfflineBadgeProps) {
  return (
    <span
      className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ${
        online
          ? 'bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800'
          : 'bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-700'
      }`}
      data-testid="offline-badge"
    >
      {online ? uk.badgeOnline : uk.badgeOffline}
    </span>
  )
}
