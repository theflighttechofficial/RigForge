import fs from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';

// Serverless hosts (Vercel) share no memory between requests and have a read-only disk,
// so scan sessions and the hardware database go to Upstash Redis when it is configured.
// Without Redis credentials (local `npm run dev`), memory + a JSON file are used instead.

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export const storeKind = redis ? 'redis' : 'local';

const DB_KEY = 'hw:user-db';
const SESSION_PREFIX = 'hw:scan:';
const DB_PATH = path.join(process.cwd(), 'data', 'user-hardware-db.json');

const memorySessions = new Map<string, { value: unknown; expiresAt: number }>();

export async function getSessionValue<T>(token: string): Promise<T | null> {
  if (redis) return (await redis.get<T>(SESSION_PREFIX + token)) ?? null;
  const entry = memorySessions.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memorySessions.delete(token);
    return null;
  }
  return entry.value as T;
}

export async function setSessionValue(token: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (redis) {
    await redis.set(SESSION_PREFIX + token, value, { ex: ttlSeconds });
    return;
  }
  const now = Date.now();
  for (const [k, v] of memorySessions) if (now > v.expiresAt) memorySessions.delete(k);
  memorySessions.set(token, { value, expiresAt: now + ttlSeconds * 1000 });
}

// Hardware database: one record per component id
export async function loadDbEntries<T>(): Promise<T[]> {
  if (redis) {
    const all = await redis.hgetall<Record<string, T>>(DB_KEY);
    return all ? Object.values(all) : [];
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return [];
  }
}

export async function saveDbEntries<T extends { id: string }>(changed: T[], all: T[]): Promise<void> {
  if (redis) {
    if (changed.length) await redis.hset(DB_KEY, Object.fromEntries(changed.map((e) => [e.id, e])));
    return;
  }
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(all, null, 2));
}
