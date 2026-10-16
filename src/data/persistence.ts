import { createAutosave, type AutosaveController } from './autosave'
import { DexieOrderRepository } from './dexieRepository'
import type { OrderRepository } from './repository'

const repository: OrderRepository = new DexieOrderRepository()
let autosave: AutosaveController | undefined

export function getOrderRepository(): OrderRepository {
  return repository
}

export function getOrderAutosave(): AutosaveController {
  if (!autosave) {
    autosave = createAutosave(repository, { delayMs: 150 })
  }
  return autosave
}
