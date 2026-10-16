import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAutosave } from './autosave'
import { ZamirDatabase, setDbForTests } from './db'
import { DexieOrderRepository } from './dexieRepository'
import { createEmptyOrder, createEmptyRoom, touchOrder } from './factories'
import { SCHEMA_VERSION } from './schemas'

describe('DexieOrderRepository', () => {
  let db: ZamirDatabase
  let repo: DexieOrderRepository

  beforeEach(async () => {
    db = new ZamirDatabase(`test-zamir-${crypto.randomUUID()}`)
    setDbForTests(db)
    repo = new DexieOrderRepository(db)
  })

  afterEach(async () => {
    await db.delete()
    setDbForTests(undefined)
  })

  it('saves and loads an order with schemaVersion', async () => {
    const order = createEmptyOrder()
    order.client = { name: 'Іван', phone: '+380501112233', address: 'Київ' }
    order.rooms = [createEmptyRoom('Кухня')]

    await repo.saveOrder(order)
    const loaded = await repo.getOrder(order.id)

    expect(loaded).toBeDefined()
    expect(loaded?.schemaVersion).toBe(SCHEMA_VERSION)
    expect(loaded?.client.name).toBe('Іван')
    expect(loaded?.rooms[0]?.name).toBe('Кухня')
  })

  it('lists orders newest-first and filters by search', async () => {
    const a = touchOrder({
      ...createEmptyOrder(),
      client: { name: 'Оля', phone: '111', address: 'Львів' },
    })
    await new Promise((r) => setTimeout(r, 5))
    const b = touchOrder({
      ...createEmptyOrder(),
      client: { name: 'Петро', phone: '222', address: 'Одеса' },
    })

    await repo.saveOrder(a)
    await repo.saveOrder(b)

    const all = await repo.listOrders()
    expect(all.map((o) => o.id)).toEqual([b.id, a.id])

    const found = await repo.listOrders({ search: 'льв' })
    expect(found).toHaveLength(1)
    expect(found[0]?.client.name).toBe('Оля')
  })

  it('deletes an order', async () => {
    const order = createEmptyOrder()
    await repo.saveOrder(order)
    await repo.deleteOrder(order.id)
    expect(await repo.getOrder(order.id)).toBeUndefined()
  })

  it('rejects invalid documents via Zod', async () => {
    const bad = { ...createEmptyOrder(), status: 'nope' }
    await expect(repo.saveOrder(bad as never)).rejects.toThrow()
  })
})

describe('createAutosave', () => {
  let db: ZamirDatabase
  let repo: DexieOrderRepository

  beforeEach(() => {
    db = new ZamirDatabase(`test-autosave-${crypto.randomUUID()}`)
    setDbForTests(db)
    repo = new DexieOrderRepository(db)
  })

  afterEach(async () => {
    await db.delete()
    setDbForTests(undefined)
  })

  it('persists every scheduled change after flush', async () => {
    const order = createEmptyOrder()
    const autosave = createAutosave(repo, { delayMs: 20 })

    autosave.schedule({ ...order, client: { ...order.client, name: 'A' } })
    autosave.schedule({ ...order, client: { ...order.client, name: 'B' } })
    await autosave.flush()

    const loaded = await repo.getOrder(order.id)
    expect(loaded?.client.name).toBe('B')
  })

  it('calls onSaved after successful write', async () => {
    const order = createEmptyOrder()
    const onSaved = vi.fn()
    const autosave = createAutosave(repo, { delayMs: 0, onSaved })

    autosave.schedule(order)
    await autosave.flush()

    expect(onSaved).toHaveBeenCalled()
    expect(onSaved.mock.calls[0]?.[0]?.id).toBe(order.id)
  })
})
