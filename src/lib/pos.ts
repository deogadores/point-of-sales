import { z } from "zod";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { units, products, stockMovements, sales, saleItems } from "@/lib/db/schema";

export const UnitSchema = z.object({
  name: z.string().trim().min(1).max(64),
  symbol: z.string().trim().max(16).optional().or(z.literal(""))
});

export const ProductSchema = z.object({
  name: z.string().trim().min(1).max(128),
  imageUrl: z.string().optional().or(z.literal("")),
  unitId: z.coerce.number().int().positive(),
  unitCostPrice: z.coerce.number().nonnegative(),
  unitSalePrice: z.coerce.number().nonnegative(),
  initialStock: z.coerce.number().nonnegative().default(0),
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
  items: z.array(SaleItemInputSchema).min(1),
  soldAt: z.string().optional(),
});

export type UnitRow = {
  id: number;
  name: string;
  symbol: string | null;
};

export type ProductRow = {
  id: number;
  store_id: number;
  name: string;
  image_url: string | null;
  unit_id: number;
  unit_cost_price: number;
  unit_sale_price: number;
  unit_name: string;
  unit_symbol: string | null;
  stock_qty: number;
};

export async function listUnits(storeId: number): Promise<UnitRow[]> {
  return db
    .select({ id: units.id, name: units.name, symbol: units.symbol })
    .from(units)
    .where(eq(units.storeId, storeId))
    .orderBy(asc(units.name));
}

export async function createUnit(storeId: number, input: unknown) {
  const data = UnitSchema.parse(input);
  await db.insert(units).values({ storeId, name: data.name, symbol: data.symbol?.length ? data.symbol : null });
}

export async function deleteUnit(storeId: number, unitId: number) {
  await db.delete(units).where(and(eq(units.id, unitId), eq(units.storeId, storeId)));
}

export async function listProductsWithStock(storeId: number): Promise<ProductRow[]> {
  const stockQty = sql<number>`COALESCE(
    (SELECT SUM(sm.quantity) FROM stock_movements sm WHERE sm.store_id = ${storeId} AND sm.product_id = ${products.id}),
    0
  )`;

  return db
    .select({
      id: products.id,
      store_id: products.storeId,
      name: products.name,
      image_url: products.imageUrl,
      unit_id: products.unitId,
      unit_cost_price: products.unitCostPrice,
      unit_sale_price: products.unitSalePrice,
      unit_name: units.name,
      unit_symbol: units.symbol,
      stock_qty: stockQty,
    })
    .from(products)
    .innerJoin(units, eq(units.id, products.unitId))
    .where(eq(products.storeId, storeId))
    .orderBy(asc(products.name)) as Promise<ProductRow[]>;
}

export async function createProduct(storeId: number, input: unknown) {
  const data = ProductSchema.parse(input);
  await db.transaction(async (tx) => {
    const [product] = await tx.insert(products).values({
      storeId,
      name: data.name,
      imageUrl: data.imageUrl?.length ? data.imageUrl : null,
      unitId: data.unitId,
      unitCostPrice: data.unitCostPrice,
      unitSalePrice: data.unitSalePrice,
    }).returning({ id: products.id });

    if (data.initialStock > 0) {
      await tx.insert(stockMovements).values({
        storeId,
        productId: product.id,
        quantity: data.initialStock,
        reason: 'Initial stock',
      });
    }
  });
}

export async function addStockMovement(storeId: number, input: unknown) {
  const data = StockMovementSchema.parse(input);
  if (!Number.isFinite(data.quantity) || data.quantity === 0) {
    throw new Error("Quantity must be a non-zero number.");
  }

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, data.productId), eq(products.storeId, storeId)))
    .limit(1);
  if (!product) throw new Error("Invalid product for this store.");

  await db.insert(stockMovements).values({
    storeId,
    productId: data.productId,
    quantity: data.quantity,
    reason: data.reason?.length ? data.reason : null,
  });
}

export async function listRecentStockMovements(storeId: number, limit = 25) {
  return db
    .select({
      id: stockMovements.id,
      created_at: stockMovements.createdAt,
      quantity: stockMovements.quantity,
      reason: stockMovements.reason,
      product_name: products.name,
      unit_symbol: units.symbol,
    })
    .from(stockMovements)
    .innerJoin(products, eq(products.id, stockMovements.productId))
    .innerJoin(units, eq(units.id, products.unitId))
    .where(eq(stockMovements.storeId, storeId))
    .orderBy(desc(stockMovements.createdAt), desc(stockMovements.id))
    .limit(limit);
}

export async function createSale(storeId: number, input: unknown) {
  const data = SaleInputSchema.parse(input);

  const productIds = [...new Set(data.items.map((i) => i.productId))];
  const productRows = await db
    .select({ id: products.id, unitCostPrice: products.unitCostPrice, unitSalePrice: products.unitSalePrice })
    .from(products)
    .where(and(eq(products.storeId, storeId), inArray(products.id, productIds)));

  const productMap = new Map(productRows.map((r) => [r.id, r]));

  const enriched = data.items.map((i) => {
    const p = productMap.get(i.productId);
    if (!p) throw new Error(`Unknown product id ${i.productId}`);
    const unitCost = p.unitCostPrice;
    const unitSale = p.unitSalePrice;
    const qty = i.quantity;
    return {
      productId: i.productId,
      quantity: qty,
      unitCostPrice: unitCost,
      unitSalePrice: unitSale,
      lineRevenue: unitSale * qty,
      lineProfit: (unitSale - unitCost) * qty,
    };
  });

  const totalRevenue = enriched.reduce((acc, it) => acc + it.lineRevenue, 0);
  const totalProfit = enriched.reduce((acc, it) => acc + it.lineProfit, 0);

  return db.transaction(async (tx) => {
    const [sale] = await tx
      .insert(sales)
      .values({ storeId, totalRevenue, totalProfit, ...(data.soldAt ? { soldAt: data.soldAt } : {}) })
      .returning({ id: sales.id });
    if (!sale) throw new Error("Failed to create sale.");

    for (const it of enriched) {
      await tx.insert(saleItems).values({
        storeId,
        saleId: sale.id,
        productId: it.productId,
        quantity: it.quantity,
        unitCostPrice: it.unitCostPrice,
        unitSalePrice: it.unitSalePrice,
        lineRevenue: it.lineRevenue,
        lineProfit: it.lineProfit,
      });
      await tx.insert(stockMovements).values({
        storeId,
        productId: it.productId,
        quantity: -it.quantity,
        reason: `Sale #${sale.id}`,
      });
    }

    return sale.id;
  });
}

export async function getDashboardStats(storeId: number) {
  const [t0] = await db
    .select({
      revenue: sql<number>`COALESCE(SUM(${sales.totalRevenue}), 0)`,
      profit: sql<number>`COALESCE(SUM(${sales.totalProfit}), 0)`,
      sales_count: sql<number>`COUNT(*)`,
    })
    .from(sales)
    .where(eq(sales.storeId, storeId));

  const topProducts = await db
    .select({
      product_id: products.id,
      product_name: products.name,
      qty_sold: sql<number>`COALESCE(SUM(${saleItems.quantity}), 0)`,
      revenue: sql<number>`COALESCE(SUM(${saleItems.lineRevenue}), 0)`,
      profit: sql<number>`COALESCE(SUM(${saleItems.lineProfit}), 0)`,
    })
    .from(saleItems)
    .innerJoin(products, eq(products.id, saleItems.productId))
    .where(eq(saleItems.storeId, storeId))
    .groupBy(products.id)
    .orderBy(desc(sql`COALESCE(SUM(${saleItems.lineRevenue}), 0)`))
    .limit(5);

  const stockQtyExpr = sql<number>`COALESCE(
    (SELECT SUM(sm.quantity) FROM stock_movements sm WHERE sm.store_id = ${storeId} AND sm.product_id = ${products.id}),
    0
  )`;

  const lowStock = await db
    .select({
      id: products.id,
      name: products.name,
      unit_symbol: units.symbol,
      stock_qty: stockQtyExpr,
    })
    .from(products)
    .innerJoin(units, eq(units.id, products.unitId))
    .where(eq(products.storeId, storeId))
    .orderBy(asc(stockQtyExpr), asc(products.name))
    .limit(8);

  return {
    revenue: Number(t0?.revenue ?? 0),
    profit: Number(t0?.profit ?? 0),
    salesCount: Number(t0?.sales_count ?? 0),
    topProducts,
    lowStock,
  };
}

export async function getDailyChart(storeId: number, days = 30) {
  const rows = await db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', ${sales.soldAt})`,
      revenue: sql<number>`COALESCE(SUM(${sales.totalRevenue}), 0)`,
      profit: sql<number>`COALESCE(SUM(${sales.totalProfit}), 0)`,
    })
    .from(sales)
    .where(and(
      eq(sales.storeId, storeId),
      sql`${sales.soldAt} >= datetime('now', ${sql.raw(`'-${days} days'`)})`,
    ))
    .groupBy(sql`strftime('%Y-%m-%d', ${sales.soldAt})`)
    .orderBy(sql`strftime('%Y-%m-%d', ${sales.soldAt})`);

  return rows.map((r) => ({ date: r.date, revenue: Number(r.revenue), profit: Number(r.profit) }));
}

export async function getMonthlyChart(storeId: number, months = 12) {
  const rows = await db
    .select({
      month: sql<string>`strftime('%Y-%m', ${sales.soldAt})`,
      revenue: sql<number>`COALESCE(SUM(${sales.totalRevenue}), 0)`,
      profit: sql<number>`COALESCE(SUM(${sales.totalProfit}), 0)`,
    })
    .from(sales)
    .where(and(
      eq(sales.storeId, storeId),
      sql`${sales.soldAt} >= datetime('now', ${sql.raw(`'-${months} months'`)})`,
    ))
    .groupBy(sql`strftime('%Y-%m', ${sales.soldAt})`)
    .orderBy(sql`strftime('%Y-%m', ${sales.soldAt})`);

  return rows.map((r) => ({ month: r.month, revenue: Number(r.revenue), profit: Number(r.profit) }));
}

export async function getTopProductsByProfit(storeId: number, limit = 8) {
  const rows = await db
    .select({
      product_id: products.id,
      product_name: products.name,
      qty_sold: sql<number>`COALESCE(SUM(${saleItems.quantity}), 0)`,
      revenue: sql<number>`COALESCE(SUM(${saleItems.lineRevenue}), 0)`,
      profit: sql<number>`COALESCE(SUM(${saleItems.lineProfit}), 0)`,
    })
    .from(saleItems)
    .innerJoin(products, eq(products.id, saleItems.productId))
    .where(eq(saleItems.storeId, storeId))
    .groupBy(products.id)
    .orderBy(desc(sql`COALESCE(SUM(${saleItems.lineProfit}), 0)`))
    .limit(limit);

  return rows.map((r) => ({
    name: String(r.product_name),
    profit: Number(r.profit),
    revenue: Number(r.revenue),
    qty_sold: Number(r.qty_sold),
  }));
}

export async function querySales(
  storeId: number,
  params: {
    start?: string;
    end?: string;
    productId?: number;
  }
) {
  const conditions = [eq(sales.storeId, storeId)];

  if (params.start) conditions.push(sql`${sales.soldAt} >= ${params.start}`);
  if (params.end) conditions.push(sql`${sales.soldAt} <= ${params.end}`);
  if (params.productId) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM ${saleItems} si WHERE si.sale_id = ${sales.id} AND si.product_id = ${params.productId})`
    );
  }

  return db
    .select({
      id: sales.id,
      sold_at: sales.soldAt,
      total_revenue: sales.totalRevenue,
      total_profit: sales.totalProfit,
      item_count: sql<number>`(SELECT COUNT(*) FROM ${saleItems} si WHERE si.sale_id = ${sales.id})`,
    })
    .from(sales)
    .where(and(...conditions))
    .orderBy(desc(sales.soldAt), desc(sales.id))
    .limit(200);
}

export async function getSaleDetail(storeId: number, saleId: number) {
  const [sale] = await db
    .select({
      id: sales.id,
      sold_at: sales.soldAt,
      total_revenue: sales.totalRevenue,
      total_profit: sales.totalProfit,
    })
    .from(sales)
    .where(and(eq(sales.storeId, storeId), eq(sales.id, saleId)))
    .limit(1);

  if (!sale) return null;

  const items = await db
    .select({
      id: saleItems.id,
      product_id: saleItems.productId,
      product_name: products.name,
      quantity: saleItems.quantity,
      unit_cost_price: saleItems.unitCostPrice,
      unit_sale_price: saleItems.unitSalePrice,
      line_revenue: saleItems.lineRevenue,
      line_profit: saleItems.lineProfit,
      unit_symbol: units.symbol,
    })
    .from(saleItems)
    .innerJoin(products, eq(products.id, saleItems.productId))
    .innerJoin(units, eq(units.id, products.unitId))
    .where(and(eq(saleItems.storeId, storeId), eq(saleItems.saleId, saleId)))
    .orderBy(asc(saleItems.id));

  return { sale, items };
}
