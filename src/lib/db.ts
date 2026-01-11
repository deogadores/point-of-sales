import { createClient, type Client } from "@libsql/client";

function getDb(): Client {
  const url = process.env.DATABASE_URL ?? "file:./pos.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  return createClient({
    url,
    authToken
  });
}

export const db = getDb();

let schemaReady: Promise<void> | null = null;

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      // Basic schema; safe to run repeatedly.
      await db.execute(`PRAGMA foreign_keys = ON;`);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS units (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          symbol TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
          unit_cost_price REAL NOT NULL CHECK (unit_cost_price >= 0),
          unit_sale_price REAL NOT NULL CHECK (unit_sale_price >= 0),
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS stock_movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          quantity REAL NOT NULL,
          reason TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sold_at TEXT NOT NULL DEFAULT (datetime('now')),
          total_revenue REAL NOT NULL,
          total_profit REAL NOT NULL
        );
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
          quantity REAL NOT NULL CHECK (quantity > 0),
          unit_cost_price REAL NOT NULL CHECK (unit_cost_price >= 0),
          unit_sale_price REAL NOT NULL CHECK (unit_sale_price >= 0),
          line_revenue REAL NOT NULL,
          line_profit REAL NOT NULL
        );
      `);

      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);`
      );
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);`
      );
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);`
      );

      // Seed a few common units if empty.
      const unitsCount = await db.execute(
        `SELECT COUNT(*) AS count FROM units;`
      );
      const countValRaw = (unitsCount.rows?.[0] as any)?.count as any;
      const countVal = Number(countValRaw ?? 0);
      if (countVal === 0) {
        await db.execute(
          `INSERT INTO units (name, symbol) VALUES ('Piece', 'pc'), ('Kilogram', 'kg'), ('Liter', 'L');`
        );
      }
    })();
  }

  await schemaReady;
}

