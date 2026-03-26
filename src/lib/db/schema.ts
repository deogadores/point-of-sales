import { sqliteTable, text, integer, real, unique } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const stores = sqliteTable('stores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  inviteCode: text('invite_code').notNull().unique(),
  currency: text('currency').notNull().default('USD'),
  liveNotifications: integer('live_notifications', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const storeMembers = sqliteTable('store_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  authUserId: text('auth_user_id').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('Staff'),
  joinedAt: text('joined_at').notNull().default(sql`(datetime('now'))`),
}, (table) => [
  unique().on(table.authUserId, table.storeId),
])

export const units = sqliteTable('units', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  symbol: text('symbol'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => [
  unique().on(table.storeId, table.name),
])

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  imageUrl: text('image_url'),
  unitId: integer('unit_id').notNull().references(() => units.id, { onDelete: 'restrict' }),
  unitCostPrice: real('unit_cost_price').notNull(),
  unitSalePrice: real('unit_sale_price').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => [
  unique().on(table.storeId, table.name),
])

export const stockMovements = sqliteTable('stock_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: real('quantity').notNull(),
  reason: text('reason'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  soldAt: text('sold_at').notNull().default(sql`(datetime('now'))`),
  totalRevenue: real('total_revenue').notNull(),
  totalProfit: real('total_profit').notNull(),
})

export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  saleId: integer('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: real('quantity').notNull(),
  unitCostPrice: real('unit_cost_price').notNull(),
  unitSalePrice: real('unit_sale_price').notNull(),
  lineRevenue: real('line_revenue').notNull(),
  lineProfit: real('line_profit').notNull(),
})

export const reservations = sqliteTable('reservations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  status: text('status', {
    enum: ['created', 'waiting_for_payment', 'payment_sent', 'payment_confirmed', 'completed'],
  }).notNull().default('created'),
  totalAmount: real('total_amount').notNull(),
  paymentProof: text('payment_proof'),
  paymentProofMime: text('payment_proof_mime'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

export const reservationItems = sqliteTable('reservation_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reservationId: integer('reservation_id').notNull().references(() => reservations.id, { onDelete: 'cascade' }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: real('quantity').notNull(),
  unitSalePrice: real('unit_sale_price').notNull(),
  subtotal: real('subtotal').notNull(),
})

// Type exports
export type Store = typeof stores.$inferSelect
export type NewStore = typeof stores.$inferInsert
export type StoreMember = typeof storeMembers.$inferSelect
export type NewStoreMember = typeof storeMembers.$inferInsert
export type Unit = typeof units.$inferSelect
export type NewUnit = typeof units.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type StockMovement = typeof stockMovements.$inferSelect
export type NewStockMovement = typeof stockMovements.$inferInsert
export type Sale = typeof sales.$inferSelect
export type NewSale = typeof sales.$inferInsert
export type SaleItem = typeof saleItems.$inferSelect
export type NewSaleItem = typeof saleItems.$inferInsert
export type Reservation = typeof reservations.$inferSelect
export type NewReservation = typeof reservations.$inferInsert
export type ReservationItem = typeof reservationItems.$inferSelect
export type NewReservationItem = typeof reservationItems.$inferInsert
