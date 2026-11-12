import {
  COLUMN_TYPES as RAW_COLUMN_TYPES,
  DEFAULT_OPTIONS as RAW_DEFAULT_OPTIONS,
  DIALECTS as RAW_DIALECTS,
} from '../../core/constants.mjs'
import type { ColumnType, Dialect, GeneratorOptions } from '@/types'

export interface ColumnTypeMeta {
  key: ColumnType
  label: string
  javaType: string
  kind: string
  defaultLength?: number
  defaultPrecision?: number
  defaultScale?: number
}

export const COLUMN_TYPES = RAW_COLUMN_TYPES as ColumnTypeMeta[]

export const DIALECTS = RAW_DIALECTS as { key: Dialect; label: string }[]

export const DEFAULT_OPTIONS = RAW_DEFAULT_OPTIONS as GeneratorOptions

const COLUMN_TYPE_MAP = new Map(COLUMN_TYPES.map((item) => [item.key, item]))

export const DIALECT_LABELS = Object.fromEntries(
  DIALECTS.map((dialect) => [dialect.key, dialect.label]),
) as Record<Dialect, string>

export function columnTypeMeta(type: ColumnType): ColumnTypeMeta {
  return COLUMN_TYPE_MAP.get(type) ?? COLUMN_TYPES[0]
}
