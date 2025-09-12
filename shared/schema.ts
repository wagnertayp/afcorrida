import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const registrants = pgTable("registrants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  bib: integer("bib").notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  payment_status: text("payment_status").notNull().default("pendente"),
});

export const insertRegistrantSchema = createInsertSchema(registrants).pick({
  name: true,
});

export const updatePaymentStatusSchema = z.object({
  id: z.string(),
  payment_status: z.enum(["pendente", "confirmado"]),
});

export type InsertRegistrant = z.infer<typeof insertRegistrantSchema>;
export type Registrant = typeof registrants.$inferSelect;
export type UpdatePaymentStatus = z.infer<typeof updatePaymentStatusSchema>;

// Admin user schema for session management
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
