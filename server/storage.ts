import { type Registrant, type InsertRegistrant, type AdminUser } from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private registrants: Map<string, Registrant>;
  private adminUsers: Map<string, AdminUser>;
  private usedBibNumbers: Set<number>;

  constructor() {
    this.registrants = new Map();
    this.adminUsers = new Map();
    this.usedBibNumbers = new Set();
    
    // Initialize admin user
    const adminId = randomUUID();
    this.adminUsers.set(adminId, {
      id: adminId,
      username: "john",
      password: "batata123", // In production, this would be hashed
    });
  }

  async getRegistrants(): Promise<Registrant[]> {
    return Array.from(this.registrants.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async getRegistrantById(id: string): Promise<Registrant | undefined> {
    return this.registrants.get(id);
  }

  async createRegistrant(insertRegistrant: InsertRegistrant): Promise<Registrant> {
    const id = randomUUID();
    const bib = this.generateUniqueBibNumber();
    const registrant: Registrant = {
      ...insertRegistrant,
      id,
      bib,
      created_at: new Date(),
      payment_status: "pendente",
    };
    
    this.registrants.set(id, registrant);
    this.usedBibNumbers.add(bib);
    return registrant;
  }

  async updatePaymentStatus(id: string, status: "pendente" | "confirmado"): Promise<Registrant | undefined> {
    const registrant = this.registrants.get(id);
    if (!registrant) return undefined;
    
    const updated = { ...registrant, payment_status: status };
    this.registrants.set(id, updated);
    return updated;
  }

  async clearAllRegistrants(): Promise<void> {
    this.registrants.clear();
    this.usedBibNumbers.clear();
  }

  async searchRegistrants(query: string): Promise<Registrant[]> {
    const allRegistrants = await this.getRegistrants();
    const lowercaseQuery = query.toLowerCase();
    
    return allRegistrants.filter(registrant => 
      registrant.name.toLowerCase().includes(lowercaseQuery) ||
      registrant.bib.toString().includes(query)
    );
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    return Array.from(this.adminUsers.values()).find(
      (user) => user.username === username
    );
  }

  private generateUniqueBibNumber(): number {
    let bib: number;
    do {
      bib = Math.floor(Math.random() * 999) + 1;
    } while (this.usedBibNumbers.has(bib));
    
    return bib;
  }
}

export const storage = new MemStorage();
