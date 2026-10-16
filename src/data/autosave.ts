import { touchOrder } from './factories'
import type { OrderRepository } from './repository'
import { orderSchema, type Order } from './schemas'

export interface AutosaveController {
  /** Queue save of the latest order snapshot (debounced). */
  schedule(order: Order): void
  /** Flush pending save immediately. */
  flush(): Promise<void>
  /** Cancel pending timer without saving. */
  cancel(): void
}

export interface AutosaveOptions {
  /** Debounce delay in ms. 0 = save immediately (async). */
  delayMs?: number
  onError?: (error: unknown) => void
  onSaved?: (order: Order) => void
}

/**
 * Autosave every change through the repository port.
 * Always persists the latest scheduled snapshot (coalesces bursts).
 */
export function createAutosave(
  repository: OrderRepository,
  options: AutosaveOptions = {},
): AutosaveController {
  const delayMs = options.delayMs ?? 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: Order | undefined
  let chain: Promise<void> = Promise.resolve()

  const persist = (order: Order): Promise<void> => {
    chain = chain
      .then(async () => {
        const toSave = orderSchema.parse(touchOrder(order))
        const saved = await repository.saveOrder(toSave)
        options.onSaved?.(saved)
      })
      .catch((error: unknown) => {
        options.onError?.(error)
      })
    return chain
  }

  return {
    schedule(order: Order) {
      pending = order
      if (timer !== undefined) clearTimeout(timer)
      if (delayMs <= 0) {
        const snap = pending
        pending = undefined
        void persist(snap)
        return
      }
      timer = setTimeout(() => {
        timer = undefined
        if (!pending) return
        const snap = pending
        pending = undefined
        void persist(snap)
      }, delayMs)
    },

    async flush() {
      if (timer !== undefined) {
        clearTimeout(timer)
        timer = undefined
      }
      if (pending) {
        const snap = pending
        pending = undefined
        await persist(snap)
      }
      await chain
    },

    cancel() {
      if (timer !== undefined) {
        clearTimeout(timer)
        timer = undefined
      }
      pending = undefined
    },
  }
}
