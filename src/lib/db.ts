import mysql from 'mysql2/promise'
import { v4 as uuidv4 } from 'uuid'

const globalForDb = globalThis as unknown as { pool: mysql.Pool | undefined }

const isMysqlUrl = Boolean(
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.startsWith('file:') &&
  (process.env.DATABASE_URL.startsWith('mysql://') || process.env.DATABASE_URL.startsWith('mysql2://'))
)

export const pool =
  (isMysqlUrl
    ? (globalForDb.pool ??
        mysql.createPool({
          uri: process.env.DATABASE_URL,
          waitForConnections: true,
          connectionLimit: 8,
          dateStrings: false,
          typeCast: (field, next) => {
            if (field.type === 'TINY' && field.length === 1) {
              const value = field.string()
              return value === null ? null : value === '1'
            }
            return next()
          },
        }))
    : null)

if (process.env.NODE_ENV !== 'production' && pool) globalForDb.pool = pool

export function newId() {
  return uuidv4()
}

type Row = Record<string, unknown>
type Where = Record<string, unknown>
type Executor = mysql.Pool | mysql.PoolConnection | null

function whereClause(where: Where | undefined): { clause: string; params: unknown[] } {
  if (!where || Object.keys(where).length === 0) return { clause: '', params: [] }
  const keys = Object.keys(where)
  const parts: string[] = []
  const params: unknown[] = []
  for (const key of keys) {
    const value = where[key]
    if (value === null) {
      parts.push(`\`${key}\` IS NULL`)
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        parts.push('1=0')
      } else {
        parts.push(`\`${key}\` IN (${value.map(() => '?').join(',')})`)
        params.push(...value)
      }
    } else {
      parts.push(`\`${key}\` = ?`)
      params.push(value)
    }
  }
  return { clause: ` WHERE ${parts.join(' AND ')}`, params }
}

export async function query<T = Row>(sql: string, params: unknown[] = [], executor: Executor = pool): Promise<T[]> {
  if (!executor || typeof executor.query !== 'function') return []
  try {
    const res = await executor.query(sql, params)
    if (!res || !Array.isArray(res) || !res[0]) return []
    return (Array.isArray(res[0]) ? res[0] : [res[0]]) as T[]
  } catch (err) {
    console.warn('[db query error]', (err as Error).message)
    return []
  }
}

export async function findMany<T = Row>(
  table: string,
  opts: { where?: Where; orderBy?: string; limit?: number; offset?: number } = {},
  executor: Executor = pool
): Promise<T[]> {
  if (!executor || typeof executor.query !== 'function') return []
  const { clause, params } = whereClause(opts.where)
  let sql = `SELECT * FROM \`${table}\`${clause}`
  if (opts.orderBy) sql += ` ORDER BY ${opts.orderBy}`
  if (opts.limit != null) sql += ` LIMIT ${Number(opts.limit)}`
  if (opts.offset != null) sql += ` OFFSET ${Number(opts.offset)}`
  return query<T>(sql, params, executor)
}

export async function findOne<T = Row>(table: string, where: Where, executor: Executor = pool): Promise<T | null> {
  if (!executor || typeof executor.query !== 'function') return null
  const rows = await findMany<T>(table, { where, limit: 1 }, executor)
  return rows[0] ?? null
}

export async function findById<T = Row>(table: string, id: string, executor: Executor = pool): Promise<T | null> {
  return findOne<T>(table, { id }, executor)
}

export async function count(table: string, where?: Where, executor: Executor = pool): Promise<number> {
  if (!executor || typeof executor.query !== 'function') return 0
  const { clause, params } = whereClause(where)
  const rows = await query<{ c: number }>(`SELECT COUNT(*) as c FROM \`${table}\`${clause}`, params, executor)
  return Number(rows[0]?.c ?? 0)
}

export async function insert<T = Row>(
  table: string,
  data: Row,
  opts: { id?: boolean } = { id: true },
  executor: Executor = pool
): Promise<T> {
  const merged = opts.id === false ? { ...data } : { id: data.id ?? newId(), ...data }
  const row = Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined))
  if (!executor || typeof executor.query !== 'function') return row as T
  try {
    const keys = Object.keys(row)
    const sql = `INSERT INTO \`${table}\` (${keys.map((k) => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`
    await executor.query(sql, keys.map((k) => row[k]))
    const idValue = (row as Row).id
    if (idValue != null) {
      const created = await findById<T>(table, String(idValue), executor)
      if (created) return created
    }
  } catch (err) {
    console.warn('[db insert warning]', (err as Error).message)
  }
  return row as T
}

export async function updateWhere(table: string, where: Where, data: Row, executor: Executor = pool): Promise<number> {
  if (!executor || typeof executor.query !== 'function') return 0
  const keys = Object.keys(data).filter((k) => data[k] !== undefined)
  if (keys.length === 0) return 0
  const setClause = keys.map((k) => `\`${k}\` = ?`).join(', ')
  const { clause, params: whereParams } = whereClause(where)
  const sql = `UPDATE \`${table}\` SET ${setClause}${clause}`
  try {
    const res = await executor.query(sql, [...keys.map((k) => data[k]), ...whereParams])
    return (res?.[0] as mysql.ResultSetHeader)?.affectedRows ?? 0
  } catch {
    return 0
  }
}

export async function updateById<T = Row>(table: string, id: string, data: Row, executor: Executor = pool): Promise<T | null> {
  await updateWhere(table, { id }, data, executor)
  return findById<T>(table, id, executor)
}

export async function remove(table: string, where: Where, executor: Executor = pool): Promise<number> {
  if (!executor || typeof executor.query !== 'function') return 0
  const { clause, params } = whereClause(where)
  try {
    const res = await executor.query(`DELETE FROM \`${table}\`${clause}`, params)
    return (res?.[0] as mysql.ResultSetHeader)?.affectedRows ?? 0
  } catch {
    return 0
  }
}

export async function removeById(table: string, id: string, executor: Executor = pool): Promise<number> {
  return remove(table, { id }, executor)
}

export async function withTransaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  if (!pool || typeof pool.getConnection !== 'function') {
    return fn(null as unknown as mysql.PoolConnection)
  }
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
