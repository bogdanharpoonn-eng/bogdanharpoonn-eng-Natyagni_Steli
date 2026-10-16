import { z } from 'zod'

/** Current persisted schema version (Dexie + document). */
export const SCHEMA_VERSION = 1 as const

export const cornerTypeSchema = z.enum(['internal', 'external'])
export const orderStatusSchema = z.enum(['draft', 'done', 'sent'])
export const fixtureTypeSchema = z.enum(['light', 'pipe', 'chandelier'])

/** Millimetres — integer, non-negative for lengths; fixtures may use any int coords. */
export const mmSchema = z.number().int()

export const clientSchema = z.object({
  name: z.string(),
  phone: z.string(),
  address: z.string(),
})

export const vertexSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  cornerType: cornerTypeSchema,
})

export const sideSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  length: mmSchema.nonnegative(),
})

export const diagonalSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  length: mmSchema.nonnegative(),
  isControl: z.boolean(),
})

export const fixtureSchema = z.object({
  id: z.string().min(1),
  type: fixtureTypeSchema,
  x: mmSchema,
  y: mmSchema,
})

export const roomSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  height: mmSchema.nonnegative().optional(),
  vertices: z.array(vertexSchema),
  sides: z.array(sideSchema),
  diagonals: z.array(diagonalSchema),
  fixtures: z.array(fixtureSchema),
  note: z.string(),
})

export const orderSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  client: clientSchema,
  note: z.string(),
  rooms: z.array(roomSchema),
  status: orderStatusSchema,
})

export type Client = z.infer<typeof clientSchema>
export type Vertex = z.infer<typeof vertexSchema>
export type Side = z.infer<typeof sideSchema>
export type Diagonal = z.infer<typeof diagonalSchema>
export type Fixture = z.infer<typeof fixtureSchema>
export type Room = z.infer<typeof roomSchema>
export type Order = z.infer<typeof orderSchema>
export type OrderStatus = z.infer<typeof orderStatusSchema>
export type CornerType = z.infer<typeof cornerTypeSchema>
export type FixtureType = z.infer<typeof fixtureTypeSchema>
