import { 
  users, venues, plans,
  type User, type InsertUser, type Venue, type InsertVenue, 
  type Plan, type InsertPlan
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Plan operations
  getPlan(id: string): Promise<Plan | undefined>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: string, updates: Partial<InsertPlan>): Promise<Plan>;

  // Venue operations
  getVenue(id: string): Promise<Venue | undefined>;
  getVenues(ids: string[]): Promise<Venue[]>;
  upsertVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: string, updates: Partial<InsertVenue>): Promise<Venue | undefined>;
  searchVenuesNearby(lat: number, lng: number, radius: number): Promise<Venue[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getPlan(id: string): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  }

  async createPlan(insertPlan: InsertPlan): Promise<Plan> {
    const [plan] = await db.insert(plans).values(insertPlan).returning();
    return plan;
  }

  async updatePlan(id: string, updates: Partial<InsertPlan>): Promise<Plan> {
    const [plan] = await db
      .update(plans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning();
    return plan;
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue;
  }

  async getVenues(ids: string[]): Promise<Venue[]> {
    if (ids.length === 0) return [];
    return await db.select().from(venues).where(inArray(venues.id, ids));
  }

  async upsertVenue(venue: InsertVenue): Promise<Venue> {
    const [upsertedVenue] = await db
      .insert(venues)
      .values(venue)
      .onConflictDoUpdate({
        target: venues.id,
        set: {
          ...venue,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedVenue;
  }

  async updateVenue(id: string, updates: Partial<InsertVenue>): Promise<Venue | undefined> {
    const [updatedVenue] = await db
      .update(venues)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(venues.id, id))
      .returning();
    return updatedVenue;
  }

  async searchVenuesNearby(lat: number, lng: number, radius: number): Promise<Venue[]> {
    // For PostgreSQL with PostGIS, you'd use ST_DWithin
    // For now, we'll use a simple bounding box approximation
    const radiusDegrees = radius / 111000; // Rough conversion from meters to degrees
    
    return await db
      .select()
      .from(venues)
      .where(
        and(
          // Simple bounding box filter - in production you'd want proper geo queries
          sql`(venues.coordinates->>'lat')::decimal BETWEEN ${lat - radiusDegrees} AND ${lat + radiusDegrees}`,
          sql`(venues.coordinates->>'lng')::decimal BETWEEN ${lng - radiusDegrees} AND ${lng + radiusDegrees}`
        )
      );
  }
}

export const storage = new DatabaseStorage();
