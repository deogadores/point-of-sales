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

async function tableExists(tableName: string) {
  const res = await db.execute({
    sql: `SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1;`,
    args: [tableName]
  });
  return Boolean((res.rows as any[])?.[0]?.ok);
}

async function columnExists(tableName: string, columnName: string) {
  const res = await db.execute(`PRAGMA table_info(${tableName});`);
  return (res.rows as any[]).some((r) => String(r.name) === columnName);
}

async function ensureColumn(
  tableName: string,
  columnName: string,
  columnSql: string
) {
  if (!(await tableExists(tableName))) return;
  if (await columnExists(tableName, columnName)) return;
  await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnSql};`);
}

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      // Basic schema; safe to run repeatedly.
      await db.execute(`PRAGMA foreign_keys = ON;`);

      // Multi-store + auth.
      await db.execute(`
        CREATE TABLE IF NOT EXISTS stores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'Staff',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);`
      );
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);`
      );

      // Ensure a default store exists for existing single-store data.
      await db.execute(`
        INSERT INTO stores (id, name)
        SELECT 1, 'Default Store'
        WHERE NOT EXISTS (SELECT 1 FROM stores WHERE id = 1);
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS units (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          symbol TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      // Products are store-scoped. If migrating from the old schema, rebuild to
      // remove the global unique(name) constraint.
      const productsExist = await tableExists("products");
      const productsHasStore = productsExist
        ? await columnExists("products", "store_id")
        : false;
      if (productsExist && !productsHasStore) {
        await db.execute(`PRAGMA foreign_keys = OFF;`);
        await db.execute(`DROP TABLE IF EXISTS products_new;`);
        await db.execute(`
          CREATE TABLE products_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
            unit_cost_price REAL NOT NULL CHECK (unit_cost_price >= 0),
            unit_sale_price REAL NOT NULL CHECK (unit_sale_price >= 0),
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(store_id, name)
          );
        `);
        await db.execute(`
          INSERT INTO products_new (id, store_id, name, unit_id, unit_cost_price, unit_sale_price, created_at)
          SELECT id, 1, name, unit_id, unit_cost_price, unit_sale_price, created_at
          FROM products;
        `);
        await db.execute(`DROP TABLE products;`);
        await db.execute(`ALTER TABLE products_new RENAME TO products;`);
        await db.execute(`PRAGMA foreign_keys = ON;`);
      } else {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
            unit_cost_price REAL NOT NULL CHECK (unit_cost_price >= 0),
            unit_sale_price REAL NOT NULL CHECK (unit_sale_price >= 0),
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(store_id, name)
          );
        `);
      }

      await db.execute(`
        CREATE TABLE IF NOT EXISTS stock_movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          quantity REAL NOT NULL,
          reason TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          sold_at TEXT NOT NULL DEFAULT (datetime('now')),
          total_revenue REAL NOT NULL,
          total_profit REAL NOT NULL
        );
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
          quantity REAL NOT NULL CHECK (quantity > 0),
          unit_cost_price REAL NOT NULL CHECK (unit_cost_price >= 0),
          unit_sale_price REAL NOT NULL CHECK (unit_sale_price >= 0),
          line_revenue REAL NOT NULL,
          line_profit REAL NOT NULL
        );
      `);

      // In case these tables pre-existed (older schema), ensure store_id columns exist.
      await ensureColumn("stock_movements", "store_id", "store_id INTEGER NOT NULL DEFAULT 1");
      await ensureColumn("sales", "store_id", "store_id INTEGER NOT NULL DEFAULT 1");
      await ensureColumn("sale_items", "store_id", "store_id INTEGER NOT NULL DEFAULT 1");

      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);`
      );
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);`
      );
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);`
      );
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);`
      );
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id);`
      );
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_stock_movements_store_id ON stock_movements(store_id);`
      );
      await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_sale_items_store_id ON sale_items(store_id);`
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

