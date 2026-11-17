import path from 'path';
import fs from 'fs';
import { Profile } from '@/types';
import { SEED_PROFILES } from './seedData';

// Determine appropriate storage directory based on environment
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NOW_REGION
);

const DB_DIR = isServerless
  ? path.join('/tmp', 'coy-data')
  : path.join(process.cwd(), 'data');

const DB_PATH = path.join(DB_DIR, 'coy.db');
const JSON_STORE_PATH = path.join(DB_DIR, 'coy-store.json');

// Memory cache fallback structure
interface JsonStore {
  profiles: Profile[];
  swipes: Array<{ swiper_id: number; swiped_id: number; action: 'like' | 'pass' }>;
}

let sqliteDb: unknown = null;
let useJsonFallback = false;

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

// ---------------------------------------------------------------------
// SQLite Engine
// ---------------------------------------------------------------------
function initSqlite() {
  if (sqliteDb) return sqliteDb;

  try {
    ensureDir();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    db.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        photo TEXT NOT NULL,
        bio TEXT NOT NULL,
        location TEXT NOT NULL,
        interests TEXT NOT NULL,
        is_current INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS swipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        swiper_id INTEGER NOT NULL,
        swiped_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(swiper_id, swiped_id)
      );
    `);

    const countRow = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: number };
    if (countRow.count === 0) {
      seedSqliteDatabase(db);
    }

    sqliteDb = db;
    return db;
  } catch (err) {
    console.warn('SQLite init error or unsupported serverless binary. Using JSON store fallback:', err);
    useJsonFallback = true;
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function seedSqliteDatabase(db: any) {
  db.exec('DELETE FROM swipes;');
  db.exec('DELETE FROM profiles;');
  try {
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('profiles', 'swipes');");
  } catch {
    // sqlite_sequence may not exist
  }

  const insertProfile = db.prepare(`
    INSERT INTO profiles (name, age, photo, bio, location, interests, is_current)
    VALUES (@name, @age, @photo, @bio, @location, @interests, @is_current)
  `);

  insertProfile.run({
    name: 'You',
    age: 23,
    photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
    bio: 'Exploring Discover on Coy',
    location: 'Bangalore',
    interests: JSON.stringify(['Tech', 'Design', 'Music', 'Coffee']),
    is_current: 1,
  });

  const insertSwipe = db.prepare(`
    INSERT INTO swipes (swiper_id, swiped_id, action)
    VALUES (?, ?, ?)
  `);

  const seedTransaction = db.transaction(() => {
    SEED_PROFILES.forEach((p, idx) => {
      const profileId = idx + 2;
      insertProfile.run({
        name: p.name,
        age: p.age,
        photo: p.photo,
        bio: p.bio,
        location: p.location,
        interests: JSON.stringify(p.interests),
        is_current: 0,
      });

      if (p.preLikesUser) {
        insertSwipe.run(profileId, 1, 'like');
      }
    });
  });

  seedTransaction();
}

// ---------------------------------------------------------------------
// JSON Store Fallback (Guarantees zero-crash operation on any serverless host)
// ---------------------------------------------------------------------
function getJsonStore(): JsonStore {
  ensureDir();
  if (fs.existsSync(JSON_STORE_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(JSON_STORE_PATH, 'utf-8'));
      return data;
    } catch {
      // Fall through to initial seed
    }
  }

  const initialStore = seedJsonStore();
  saveJsonStore(initialStore);
  return initialStore;
}

function saveJsonStore(store: JsonStore) {
  ensureDir();
  try {
    fs.writeFileSync(JSON_STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed writing json store:', e);
  }
}

function seedJsonStore(): JsonStore {
  const profiles: Profile[] = [
    {
      id: 1,
      name: 'You',
      age: 23,
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
      bio: 'Exploring Discover on Coy',
      location: 'Bangalore',
      interests: ['Tech', 'Design', 'Music', 'Coffee'],
      is_current: 1,
    },
  ];

  const swipes: Array<{ swiper_id: number; swiped_id: number; action: 'like' | 'pass' }> = [];

  SEED_PROFILES.forEach((p, idx) => {
    const profileId = idx + 2;
    profiles.push({
      id: profileId,
      name: p.name,
      age: p.age,
      photo: p.photo,
      bio: p.bio,
      location: p.location,
      interests: p.interests,
      is_current: 0,
    });

    if (p.preLikesUser) {
      swipes.push({ swiper_id: profileId, swiped_id: 1, action: 'like' });
    }
  });

  return { profiles, swipes };
}

// ---------------------------------------------------------------------
// Public API Methods
// ---------------------------------------------------------------------
export function getFeedProfiles(userId = 1): Profile[] {
  if (!useJsonFallback) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db: any = initSqlite();
      if (db) {
        const rows = db.prepare(`
          SELECT id, name, age, photo, bio, location, interests, is_current
          FROM profiles
          WHERE is_current = 0
            AND id NOT IN (
              SELECT swiped_id FROM swipes WHERE swiper_id = ?
            )
          ORDER BY id ASC
        `).all(userId) as Array<{
          id: number;
          name: string;
          age: number;
          photo: string;
          bio: string;
          location: string;
          interests: string;
          is_current: number;
        }>;

        return rows.map((r) => ({
          ...r,
          interests: JSON.parse(r.interests || '[]'),
        }));
      }
    } catch {
      useJsonFallback = true;
    }
  }

  // JSON Fallback
  const store = getJsonStore();
  const swipedIds = new Set(
    store.swipes.filter((s) => s.swiper_id === userId).map((s) => s.swiped_id)
  );

  return store.profiles.filter((p) => p.is_current !== 1 && !swipedIds.has(p.id));
}

export function recordSwipe(
  swiperId = 1,
  swipedId: number,
  action: 'like' | 'pass'
): { matched: boolean; matchedProfile?: Profile } {
  if (!useJsonFallback) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db: any = initSqlite();
      if (db) {
        db.prepare(`
          INSERT INTO swipes (swiper_id, swiped_id, action)
          VALUES (?, ?, ?)
          ON CONFLICT(swiper_id, swiped_id) DO UPDATE SET action = excluded.action
        `).run(swiperId, swipedId, action);

        if (action === 'pass') {
          return { matched: false };
        }

        const otherSwipe = db.prepare(`
          SELECT action FROM swipes
          WHERE swiper_id = ? AND swiped_id = ?
        `).get(swipedId, swiperId) as { action: string } | undefined;

        const isMutual = otherSwipe?.action === 'like';

        if (isMutual) {
          const matchedRow = db.prepare(`
            SELECT id, name, age, photo, bio, location, interests, is_current
            FROM profiles WHERE id = ?
          `).get(swipedId) as {
            id: number;
            name: string;
            age: number;
            photo: string;
            bio: string;
            location: string;
            interests: string;
            is_current: number;
          };

          return {
            matched: true,
            matchedProfile: matchedRow
              ? { ...matchedRow, interests: JSON.parse(matchedRow.interests || '[]') }
              : undefined,
          };
        }

        return { matched: false };
      }
    } catch {
      useJsonFallback = true;
    }
  }

  // JSON Fallback
  const store = getJsonStore();

  // Remove existing swipe if any, then add new
  store.swipes = store.swipes.filter(
    (s) => !(s.swiper_id === swiperId && s.swiped_id === swipedId)
  );
  store.swipes.push({ swiper_id: swiperId, swiped_id: swipedId, action });
  saveJsonStore(store);

  if (action === 'pass') {
    return { matched: false };
  }

  const isMutual = store.swipes.some(
    (s) => s.swiper_id === swipedId && s.swiped_id === swiperId && s.action === 'like'
  );

  if (isMutual) {
    const matchedProfile = store.profiles.find((p) => p.id === swipedId);
    return {
      matched: true,
      matchedProfile,
    };
  }

  return { matched: false };
}

export function getMutualMatches(userId = 1): Profile[] {
  if (!useJsonFallback) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db: any = initSqlite();
      if (db) {
        const rows = db.prepare(`
          SELECT p.id, p.name, p.age, p.photo, p.bio, p.location, p.interests, p.is_current
          FROM profiles p
          JOIN swipes s1 ON s1.swiped_id = p.id AND s1.swiper_id = ? AND s1.action = 'like'
          JOIN swipes s2 ON s2.swiper_id = p.id AND s2.swiped_id = ? AND s2.action = 'like'
          ORDER BY s1.id DESC
        `).all(userId, userId) as Array<{
          id: number;
          name: string;
          age: number;
          photo: string;
          bio: string;
          location: string;
          interests: string;
          is_current: number;
        }>;

        return rows.map((r) => ({
          ...r,
          interests: JSON.parse(r.interests || '[]'),
        }));
      }
    } catch {
      useJsonFallback = true;
    }
  }

  // JSON Fallback
  const store = getJsonStore();
  const userLikes = new Set(
    store.swipes.filter((s) => s.swiper_id === userId && s.action === 'like').map((s) => s.swiped_id)
  );

  const mutualMatchedIds = new Set(
    store.swipes
      .filter((s) => s.swiped_id === userId && s.action === 'like' && userLikes.has(s.swiper_id))
      .map((s) => s.swiper_id)
  );

  return store.profiles.filter((p) => mutualMatchedIds.has(p.id));
}

export function resetApp(): void {
  if (!useJsonFallback) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db: any = initSqlite();
      if (db) {
        seedSqliteDatabase(db);
        return;
      }
    } catch {
      useJsonFallback = true;
    }
  }

  const initialStore = seedJsonStore();
  saveJsonStore(initialStore);
}
