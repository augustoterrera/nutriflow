import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";

export function getDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return dataDir;
}

export function getDbPath() {
  return path.join(getDataDir(), "tomi_nutri.sqlite");
}

let dbPromise: Promise<Database> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = open({
      filename: getDbPath(),
      driver: sqlite3.Database,
    }).then(async (db) => {
      await db.exec("PRAGMA journal_mode = WAL;");
      await db.exec("PRAGMA foreign_keys = ON;");
      return db;
    });
  }
  return dbPromise;
}

/**
 * Para restaurar backups: cerramos y reseteamos el singleton.
 */
export async function resetDB() {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.close();
  dbPromise = null;
}
