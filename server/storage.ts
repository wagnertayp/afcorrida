import { type Registrant, type InsertRegistrant, type AdminUser, registrants, adminUsers } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, ilike, or } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Registrant operations
  getRegistrants(): Promise<Registrant[]>;
  getRegistrantById(id: string): Promise<Registrant | undefined>;
  createRegistrant(registrant: InsertRegistrant): Promise<Registrant>;
  updatePaymentStatus(id: string, status: "pendente" | "confirmado"): Promise<Registrant | undefined>;
  clearAllRegistrants(): Promise<void>;
  searchRegistrants(query: string): Promise<Registrant[]>;
  
  // Admin operations
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
}

export class DatabaseStorage implements IStorage {
  private adminSeeded = false;
  
  constructor() {
    // Seed admin user on startup with retry logic
    this.seedAdminUserWithRetry();
  }

  private async seedAdminUserWithRetry(): Promise<void> {
    if (this.adminSeeded) return;
    
    let attempts = 0;
    const maxAttempts = 10;
    const retryDelay = 1000; // 1 second
    
    while (attempts < maxAttempts) {
      try {
        await this.seedAdminUser();
        this.adminSeeded = true;
        console.log("Admin user seeded successfully");
        return;
      } catch (error) {
        attempts++;
        console.log(`Admin seeding attempt ${attempts} failed:`, error instanceof Error ? error.message : 'Unknown error');
        
        if (attempts >= maxAttempts) {
          console.error("Admin user seeding failed after maximum attempts. Manual seeding may be required.");
          return;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  private async seedAdminUser(): Promise<void> {
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, "john"))
      .limit(1);

    if (existingAdmin.length === 0) {
      // Hash the default password
      const hashedPassword = await bcrypt.hash("batata123", 10);
      
      await db.insert(adminUsers).values({
        username: "john",
        password: hashedPassword,
      });
      console.log("Default admin user created with username: john");
    }
  }

  // Public method to trigger admin seeding if needed
  public async ensureAdminSeeded(): Promise<void> {
    if (!this.adminSeeded) {
      await this.seedAdminUserWithRetry();
    }
  }

  async getRegistrants(): Promise<Registrant[]> {
    return await db
      .select()
      .from(registrants)
      .orderBy(desc(registrants.created_at));
  }

  async getRegistrantById(id: string): Promise<Registrant | undefined> {
    const result = await db
      .select()
      .from(registrants)
      .where(eq(registrants.id, id))
      .limit(1);
    
    return result[0];
  }

  async createRegistrant(insertRegistrant: InsertRegistrant): Promise<Registrant> {
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        const bib = await this.generateUniqueBibNumber();
        
        const result = await db
          .insert(registrants)
          .values({
            ...insertRegistrant,
            bib,
          })
          .returning();
        
        return result[0];
      } catch (error) {
        attempts++;
        
        // Check if it's a unique constraint violation on bib number
        if (error instanceof Error && error.message.includes('duplicate') && error.message.includes('bib')) {
          if (attempts >= maxAttempts) {
            throw new Error("Unable to create registrant due to bib number conflicts after maximum attempts");
          }
          
          // Wait a bit before retrying to avoid thundering herd
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
          continue;
        }
        
        // If it's not a bib conflict, re-throw the error
        throw error;
      }
    }
    
    throw new Error("Unable to create registrant after maximum attempts");
  }

  async updatePaymentStatus(id: string, status: "pendente" | "confirmado"): Promise<Registrant | undefined> {
    const result = await db
      .update(registrants)
      .set({ payment_status: status })
      .where(eq(registrants.id, id))
      .returning();
    
    return result[0];
  }

  async clearAllRegistrants(): Promise<void> {
    await db.delete(registrants);
  }

  async searchRegistrants(query: string): Promise<Registrant[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    return await db
      .select()
      .from(registrants)
      .where(
        or(
          ilike(registrants.name, searchTerm),
          eq(registrants.bib, parseInt(query) || -1)
        )
      )
      .orderBy(desc(registrants.created_at));
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const result = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username))
      .limit(1);
    
    return result[0];
  }

  private async generateUniqueBibNumber(): Promise<number> {
    let bib: number;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      bib = Math.floor(Math.random() * 999) + 1;
      
      const existingBib = await db
        .select()
        .from(registrants)
        .where(eq(registrants.bib, bib))
        .limit(1);
      
      if (existingBib.length === 0) {
        return bib;
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error("Unable to generate unique bib number after maximum attempts");
      }
    } while (true);
  }
}

export const storage = new DatabaseStorage();
