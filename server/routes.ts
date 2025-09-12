import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRegistrantSchema, updatePaymentStatusSchema } from "@shared/schema";
import express from "express";
import session from "express-session";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "fallback-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Registration endpoints
  app.get("/api/registrants", async (req, res) => {
    try {
      const { search } = req.query;
      let registrants;
      
      if (search && typeof search === 'string') {
        registrants = await storage.searchRegistrants(search);
      } else {
        registrants = await storage.getRegistrants();
      }
      
      res.json(registrants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch registrants" });
    }
  });

  app.post("/api/registrants", async (req, res) => {
    try {
      const validatedData = insertRegistrantSchema.parse(req.body);
      const registrant = await storage.createRegistrant(validatedData);
      res.status(201).json(registrant);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create registrant" });
      }
    }
  });

  app.patch("/api/registrants/:id/payment-status", async (req, res) => {
    try {
      const { id } = req.params;
      const { payment_status } = updatePaymentStatusSchema.parse({ 
        id, 
        payment_status: req.body.payment_status 
      });
      
      const updatedRegistrant = await storage.updatePaymentStatus(id, payment_status);
      
      if (!updatedRegistrant) {
        return res.status(404).json({ message: "Registrant not found" });
      }
      
      res.json(updatedRegistrant);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update payment status" });
      }
    }
  });

  app.delete("/api/registrants", async (req, res) => {
    try {
      // Check if admin is logged in
      if (!(req.session as any)?.adminId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      await storage.clearAllRegistrants();
      res.json({ message: "All registrants cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear registrants" });
    }
  });

  // CSV export endpoint
  app.get("/api/registrants/export", async (req, res) => {
    try {
      // Check if admin is logged in
      if (!(req.session as any)?.adminId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const registrants = await storage.getRegistrants();
      
      // Generate CSV content
      const csvHeader = "Número,Nome,Data/Hora,Status\n";
      const csvRows = registrants.map(r => 
        `${r.bib},"${r.name}","${new Date(r.created_at).toLocaleString('pt-BR')}","${r.payment_status}"`
      ).join("\n");
      
      const csvContent = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="inscricoes.csv"');
      res.send('\ufeff' + csvContent); // BOM for Excel compatibility
    } catch (error) {
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  // Admin authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      
      const admin = await storage.getAdminByUsername(username);
      
      if (!admin || admin.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      (req.session as any).adminId = admin.id;
      res.json({ message: "Login successful", admin: { id: admin.id, username: admin.username } });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/check", (req, res) => {
    const adminId = (req.session as any)?.adminId;
    if (adminId) {
      res.json({ authenticated: true });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Statistics endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const registrants = await storage.getRegistrants();
      const total = registrants.length;
      const confirmed = registrants.filter(r => r.payment_status === "confirmado").length;
      const pending = registrants.filter(r => r.payment_status === "pendente").length;
      
      res.json({ total, confirmed, pending });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
