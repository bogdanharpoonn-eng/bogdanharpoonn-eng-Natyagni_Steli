import Dexie, { type Table } from 'dexie'
import { SCHEMA_VERSION, type Order } from './schemas'

/**
 * Dexie database. Version number tracks IndexedDB schema (indexes/stores).
 * Document `schemaVersion` on Order tracks domain migrations separately.
 */
export class ZamirDatabase extends Dexie {
  orders!: Table<Order, string>

  constructor(name = 'zamir-natyazhnyh-stel') {
    super(name)
    this.version(SCHEMA_VERSION).stores({
      orders: 'id, updatedAt, status, client.name, client.phone, client.address',
    })
  }
}

let defaultDb: ZamirDatabase | undefined

export function getDb(): ZamirDatabase {
  if (!defaultDb) {
    defaultDb = new ZamirDatabase()
  }
  return defaultDb
}

/** Test helper: replace / clear singleton. */
export function setDbForTests(db: ZamirDatabase | undefined): void {
  defaultDb = db
}
