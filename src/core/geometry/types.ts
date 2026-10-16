/** Millimetres (integer in domain model; computations may use float). */
export type Mm = number

export type VertexLabel = string

export type CornerType = 'internal' | 'external'

export type ErrorStatus = 'ok' | 'warn' | 'fail'

export interface Point {
  x: Mm
  y: Mm
}

export interface VertexInput {
  label: VertexLabel
  cornerType: CornerType
}

export interface SideInput {
  from: VertexLabel
  to: VertexLabel
  length: Mm
}

export interface DiagonalInput {
  from: VertexLabel
  to: VertexLabel
  length: Mm
  /** false = used for triangulation / construction; true = control only */
  isControl: boolean
}

export interface BuildRoomInput {
  vertices: VertexInput[]
  sides: SideInput[]
  diagonals: DiagonalInput[]
  /** Default 10 mm */
  toleranceMm?: number
}

export interface MeasurementResidual {
  kind: 'side' | 'diagonal'
  from: VertexLabel
  to: VertexLabel
  measured: Mm
  computed: Mm
  residualMm: Mm
  isControl: boolean
}

export interface BuiltVertex {
  label: VertexLabel
  x: Mm
  y: Mm
  cornerType: CornerType
  interiorAngleDeg: number
}

export interface BuildRoomSuccess {
  ok: true
  vertices: BuiltVertex[]
  areaM2: number
  perimeterM: number
  internalCornerCount: number
  externalCornerCount: number
  residuals: MeasurementResidual[]
  maxResidualMm: number
  errorStatus: ErrorStatus
  /** Set when status is warn or fail */
  message?: string
}

export interface SuggestedDiagonal {
  from: VertexLabel
  to: VertexLabel
}

export interface BuildRoomFailure {
  ok: false
  code:
    | 'invalid_input'
    | 'missing_diagonals'
    | 'invalid_triangulation'
    | 'triangle_inequality'
    | 'build_failed'
    | 'self_intersection'
  message: string
  suggestedDiagonals?: SuggestedDiagonal[]
  triangleName?: string
}

export type BuildRoomResult = BuildRoomSuccess | BuildRoomFailure

export const DEFAULT_TOLERANCE_MM = 10
