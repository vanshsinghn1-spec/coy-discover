import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Profile } from '@/types';
import { SEED_PROFILES } from './seedData';

// Maintain a single database connection instance across Next.js reloads
declare global {
  // eslint-disable-next-line no-var
  var __coyDbInstance: Database.Database | undefined;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'coy.db');

export function getDb(): Database.Database {
  if (global.__coyDbInstance) {
    return global.__coyDbInstance;
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Initialize tables
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

  // Check if we need to seed
  const countRow = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: number };
  if (countRow.count === 0) {
    seedDatabase(db);
  }

  global.__coyDbInstance = db;
  return db;
}

export function seedDatabase(db: Database.Database) {
  // Clear any existing data
  db.exec('DELETE FROM swipes;');
  db.exec('DELETE FROM profiles;');
  try {
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('profiles', 'swipes');");
  } catch {
    // sqlite_sequence may not exist yet
  }

  // 1. Insert Logged-in User (ID = 1)
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

  // 2. Insert 30 Seed Profiles
  const insertSwipe = db.prepare(`
    INSERT INTO swipes (swiper_id, swiped_id, action)
    VALUES (?, ?, ?)
  `);

  const seedTransaction = db.transaction(() => {
    SEED_PROFILES.forEach((p, idx) => {
      const profileId = idx + 2; // IDs will be 2 through 31
      insertProfile.run({
        name: p.name,
        age: p.age,
        photo: p.photo,
        bio: p.bio,
        location: p.location,
        interests: JSON.stringify(p.interests),
        is_current: 0,
      });

      // If preLikesUser is true, seed a "like" swipe towards user 1 (logged-in user)
      if (p.preLikesUser) {
        insertSwipe.run(profileId, 1, 'like');
      }
    });
  });

  seedTransaction();
}

/**
 * Returns profiles that the logged-in user (ID = 1) has not yet swiped on.
 * Never reveals who has liked the user.
 */
export function getFeedProfiles(userId = 1): Profile[] {
  const db = getDb();
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

/**
 * Records a swipe (like or pass).
 * Returns whether it created a mutual match.
 */
export function recordSwipe(
  swiperId = 1,
  swipedId: number,
  action: 'like' | 'pass'
): { matched: boolean; matchedProfile?: Profile } {
  const db = getDb();

  // Insert or update swipe
  db.prepare(`
    INSERT INTO swipes (swiper_id, swiped_id, action)
    VALUES (?, ?, ?)
    ON CONFLICT(swiper_id, swiped_id) DO UPDATE SET action = excluded.action
  `).run(swiperId, swipedId, action);

  // If action is pass, it can never be a match
  if (action === 'pass') {
    return { matched: false };
  }

  // If action is like, check if the other user also liked the swiper
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

/**
 * Returns all mutual matches for the user.
 */
export function getMutualMatches(userId = 1): Profile[] {
  const db = getDb();
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

/**
 * Helper to reset all swipes and re-seed (ideal for testing/demo).
 */
export function resetApp(): void {
  const db = getDb();
  seedDatabase(db);
}
