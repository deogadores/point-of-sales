import { z } from "zod";
import { db, ensureSchema } from "@/lib/db";

export const UnitSchema = z.object({
  name: z.string().trim().min(1).max(64),
  symbol: z.string().trim().max(16).optional().or(z.literal(""))
});

export const ProductSchema = z.object({
  name: z.string().trim().min(1).max(128),
  unitId: z.coerce.number().int().positive(),
  unitCostPrice: z.coerce.number().nonnegative(),
  unitSalePrice: z.coerce.number().nonnegative()
});

export const StockMovementSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number(),
  reason: z.string().trim().max(200).optional().or(z.literal(""))
});

export const SaleItemInputSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().positive()
});

export const SaleInputSchema = z.object({
  items: z.array(SaleItemInputSchema).min(1)
});

export type UnitRow = {
  id: number;
  name: string;
  symbol: string | null;
};

export type ProductRow = {
  id: number;
  name: string;
  unit_id: number;
  unit_cost_price: number;
  unit_sale_price: number;
  unit_name: string;
  unit_symbol: string | null;
  stock_qty: number;
};

export async function listUnits(): Promise<UnitRow[]> {
  await ensureSchema();
  const res = await db.execute(
    `SELECT id, name, symbol FROM units ORDER BY name ASC;`
  );
  return res.rows as any;
}

export async function createUnit(input: unknown) {
  await ensureSchema();
  const data = UnitSchema.parse(input);
  await db.execute({
    sql: `INSERT INTO units (name, symbol) VALUES (?, ?);`,
    args: [data.name, data.symbol?.length ? data.symbol : null]
  });
}

export async function deleteUnit(unitId: number) {
  await ensureSchema();
  await db.execute({
    sql: `DELETE FROM units WHERE id = ?;`,
    args: [unitId]
  });
}

export async function listProductsWithStock(): Promise<ProductRow[]> {
  await ensureSchema();
  const res = await db.execute(`
    SELECT
      p.id,
      p.name,
      p.unit_id,
      p.unit_cost_price,
      p.unit_sale_price,
      u.name AS unit_name,
      u.symbol AS unit_symbol,
      COALESCE((SELECT SUM(sm.quantity) FROM stock_movements sm WHERE sm.product_id = p.id), 0) AS stock_qty
    FROM products p
    JOIN units u ON u.id = p.unit_id
    ORDER BY p.name ASC;
  `);
  return res.rows as any;
}

export async function createProduct(input: unknown) {
  await ensureSchema();
  const data = ProductSchema.parse(input);
  await db.execute({
    sql: `
      INSERT INTO products (name, unit_id, unit_cost_price, unit_sale_price)
      VALUES (?, ?, ?, ?);
    `,
    args: [data.name, data.unitId, data.unitCostPrice, data.unitSalePrice]
  });
}

export async function addStockMovement(input: unknown) {
  await ensureSchema();
  const data = StockMovementSchema.parse(input);
  if (!Number.isFinite(data.quantity) || data.quantity === 0) {
    throw new Error("Quantity must be a non-zero number.");
  }

  await db.execute({
    sql: `INSERT INTO stock_movements (product_id, quantity, reason) VALUES (?, ?, ?);`,
    args: [data.productId, data.quantity, data.reason?.length ? data.reason : null]
  });
}

export async function listRecentStockMovements(limit = 25) {
  await ensureSchema();
  const res = await db.execute({
    sql: `
      SELECT
        sm.id,
        sm.created_at,
        sm.quantity,
        sm.reason,
        p.name AS product_name,
        u.symbol AS unit_symbol
      FROM stock_movements sm
      JOIN products p ON p.id = sm.product_id
      JOIN units u ON u.id = p.unit_id
      ORDER BY sm.created_at DESC, sm.id DESC
      LIMIT ?;
    `,
    args: [limit]
  });
  return res.rows as any[];
}

export async function createSale(input: unknown) {
  await ensureSchema();
  const data = SaleInputSchema.parse(input);

  // Load current prices for all products involved.
  const productIds = [...new Set(data.items.map((i) => i.productId))];
  const placeholders = productIds.map(() => "?").join(",");
  const productsRes = await db.execute({
    sql: `
      SELECT id, name, unit_cost_price, unit_sale_price
      FROM products
      WHERE id IN (${placeholders});
    `,
    args: productIds
  });
  const products = new Map<number, any>(
    (productsRes.rows as any[]).map((r) => [Number(r.id), r])
  );

  const enriched = data.items.map((i) => {
    const p = products.get(i.productId);
    if (!p) throw new Error(`Unknown product id ${i.productId}`);
    const unitCost = Number(p.unit_cost_price);
    const unitSale = Number(p.unit_sale_price);
    const qty = i.quantity;
    const lineRevenue = unitSale * qty;
    const lineProfit = (unitSale - unitCost) * qty;
    return {
      productId: i.productId,
      quantity: qty,
      unitCostPrice: unitCost,
      unitSalePrice: unitSale,
      lineRevenue,
      lineProfit
    };
  });

  const totalRevenue = enriched.reduce((acc, it) => acc + it.lineRevenue, 0);
  const totalProfit = enriched.reduce((acc, it) => acc + it.lineProfit, 0);

  await db.execute(`BEGIN;`);
  try {
    const saleRes = await db.execute({
      sql: `INSERT INTO sales (total_revenue, total_profit) VALUES (?, ?) RETURNING id;`,
      args: [totalRevenue, totalProfit]
    });
    const saleId = Number((saleRes.rows as any[])[0]?.id);
    if (!saleId) throw new Error("Failed to create sale.");

    for (const it of enriched) {
      await db.execute({
        sql: `
          INSERT INTO sale_items (
            sale_id, product_id, quantity, unit_cost_price, unit_sale_price, line_revenue, line_profit
          ) VALUES (?, ?, ?, ?, ?, ?, ?);
        `,
        args: [
          saleId,
          it.productId,
          it.quantity,
          it.unitCostPrice,
          it.unitSalePrice,
          it.lineRevenue,
          it.lineProfit
        ]
      });

      // Stock reduction.
      await db.execute({
        sql: `INSERT INTO stock_movements (product_id, quantity, reason) VALUES (?, ?, ?);`,
        args: [it.productId, -it.quantity, `Sale #${saleId}`]
      });
    }

    await db.execute(`COMMIT;`);
    return saleId;
  } catch (e) {
    await db.execute(`ROLLBACK;`);
    throw e;
  }
}

export async function getDashboardStats() {
  await ensureSchema();

  const totals = await db.execute(`
    SELECT
      COALESCE(SUM(total_revenue), 0) AS revenue,
      COALESCE(SUM(total_profit), 0) AS profit,
      COUNT(*) AS sales_count
    FROM sales;
  `);

  const topProducts = await db.execute(`
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      COALESCE(SUM(si.quantity), 0) AS qty_sold,
      COALESCE(SUM(si.line_revenue), 0) AS revenue,
      COALESCE(SUM(si.line_profit), 0) AS profit
    FROM sale_items si
    JOIN products p ON p.id = si.product_id
    GROUP BY p.id
    ORDER BY revenue DESC
    LIMIT 5;
  `);

  const lowStock = await db.execute(`
    SELECT
      p.id,
      p.name,
      u.symbol AS unit_symbol,
      COALESCE((SELECT SUM(sm.quantity) FROM stock_movements sm WHERE sm.product_id = p.id), 0) AS stock_qty
    FROM products p
    JOIN units u ON u.id = p.unit_id
    ORDER BY stock_qty ASC, p.name ASC
    LIMIT 8;
  `);

  const t0 = (totals.rows as any[])[0] ?? {};
  return {
    revenue: Number(t0.revenue ?? 0),
    profit: Number(t0.profit ?? 0),
    salesCount: Number(t0.sales_count ?? 0),
    topProducts: topProducts.rows as any[],
    lowStock: lowStock.rows as any[]
  };
}

export async function querySales(params: {
  start?: string;
  end?: string;
  productId?: number;
}) {
  await ensureSchema();

  const where: string[] = [];
  const args: any[] = [];

  if (params.start) {
    where.push(`s.sold_at >= ?`);
    args.push(params.start);
  }
  if (params.end) {
    where.push(`s.sold_at <= ?`);
    args.push(params.end);
  }
  if (params.productId) {
    where.push(`EXISTS (SELECT 1 FROM sale_items si WHERE si.sale_id = s.id AND si.product_id = ?)`);
    args.push(params.productId);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const res = await db.execute({
    sql: `
      SELECT
        s.id,
        s.sold_at,
        s.total_revenue,
        s.total_profit,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS item_count
      FROM sales s
      ${whereSql}
      ORDER BY s.sold_at DESC, s.id DESC
      LIMIT 200;
    `,
    args
  });

  return res.rows as any[];
}

export async function getSaleDetail(saleId: number) {
  await ensureSchema();

  const saleRes = await db.execute({
    sql: `SELECT id, sold_at, total_revenue, total_profit FROM sales WHERE id = ?;`,
    args: [saleId]
  });
  const sale = (saleRes.rows as any[])[0];
  if (!sale) return null;

  const itemsRes = await db.execute({
    sql: `
      SELECT
        si.id,
        si.product_id,
        p.name AS product_name,
        si.quantity,
        si.unit_cost_price,
        si.unit_sale_price,
        si.line_revenue,
        si.line_profit,
        u.symbol AS unit_symbol
      FROM sale_items si
      JOIN products p ON p.id = si.product_id
      JOIN units u ON u.id = p.unit_id
      WHERE si.sale_id = ?
      ORDER BY si.id ASC;
    `,
    args: [saleId]
  });

  return { sale, items: itemsRes.rows as any[] };
}

