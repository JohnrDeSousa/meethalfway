import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for optional authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meeting plans/sessions
export const plans = pgTable("plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: varchar("title"),
  participants: jsonb("participants").$type<Array<{
    id: string;
    location: string;
    coordinates?: { lat: number; lng: number };
  }>>().notNull(),
  midpoint: jsonb("midpoint").$type<{ lat: number; lng: number }>(),
  selectedVenues: jsonb("selected_venues").$type<Array<string>>().default([]),
  filters: jsonb("filters").$type<{
    venueTypes?: string[];
    minRating?: number;
    priceRange?: string[];
    maxDistance?: number;
  }>(),
  preferences: jsonb("preferences").$type<{
    naturalLanguageQuery?: string;
    dietaryRestrictions?: string[];
    accessibility?: string[];
    mood?: string;
    activityType?: string;
    timeOfDay?: string;
    groupSize?: number;
    budget?: string;
  }>().default({}),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cached venue data
export const venues = pgTable("venues", {
  id: varchar("id").primaryKey(), // Google Place ID
  name: varchar("name").notNull(),
  category: varchar("category"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count"),
  priceLevel: integer("price_level"),
  address: text("address"),
  coordinates: jsonb("coordinates").$type<{ lat: number; lng: number }>().notNull(),
  openingHours: jsonb("opening_hours").$type<Array<string>>(),
  photos: jsonb("photos").$type<Array<string>>(),
  website: varchar("website"),
  phoneNumber: varchar("phone_number"),
  isOpenNow: boolean("is_open_now"),
  features: jsonb("features").$type<Array<string>>(),
  aiAnalysis: jsonb("ai_analysis").$type<{
    ambiance?: string;
    goodFor?: string[];
    bestTimeToVisit?: string;
    crowdLevel?: string;
    atmosphereScore?: number;
    personalityMatch?: number;
  }>(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVenueSchema = createInsertSchema(venues).omit({
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;

// API request/response types
export const createPlanSchema = z.object({
  participants: z.array(z.object({
    id: z.string(),
    location: z.string(),
  })).min(2).max(10),
  title: z.string().optional(),
  filters: z.object({
    venueTypes: z.array(z.string()).optional(),
    minRating: z.number().min(1).max(5).optional(),
    priceRange: z.array(z.string()).optional(),
    maxDistance: z.number().positive().optional(),
  }).optional(),
  preferences: z.object({
    naturalLanguageQuery: z.string().optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    accessibility: z.array(z.string()).optional(),
    mood: z.string().optional(),
    activityType: z.string().optional(),
    timeOfDay: z.string().optional(),
    groupSize: z.number().positive().optional(),
    budget: z.string().optional(),
  }).optional(),
});

export const searchVenuesSchema = z.object({
  planId: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  radius: z.number().positive().default(5000),
  type: z.string().optional(),
  minRating: z.number().min(1).max(5).optional(),
  priceLevel: z.array(z.number().min(0).max(4)).optional(),
});

export type CreatePlanRequest = z.infer<typeof createPlanSchema>;
export type SearchVenuesRequest = z.infer<typeof searchVenuesSchema>;
