import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createPlanSchema, searchVenuesSchema } from "@shared/schema";
import { PlacesService } from "./services/places";
import { parseUserPreferences, analyzeVenue, generatePersonalizedRecommendations } from "./services/ai";
import { calculateMidpoint, calculateDistance } from "./services/midpoint";

const placesService = new PlacesService();

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create a new meeting plan
  app.post("/api/plans", async (req, res) => {
    try {
      const data = createPlanSchema.parse(req.body);
      
      // Geocode all participant locations
      const participantsWithCoords = await Promise.all(
        data.participants.map(async (participant) => {
          try {
            const coords = await placesService.geocodeAddress(participant.location);
            return { ...participant, coordinates: coords };
          } catch (error) {
            throw new Error(`Failed to geocode location: ${participant.location}`);
          }
        })
      );

      // Calculate midpoint
      const midpoint = calculateMidpoint(
        participantsWithCoords.map(p => p.coordinates!)
      );

      // Parse AI preferences if provided
      let processedPreferences;
      if (data.preferences?.naturalLanguageQuery) {
        try {
          processedPreferences = await parseUserPreferences(data.preferences.naturalLanguageQuery);
        } catch (error) {
          console.warn("Failed to parse user preferences:", error);
          processedPreferences = data.preferences;
        }
      }

      const plan = await storage.createPlan({
        participants: participantsWithCoords,
        midpoint,
        title: data.title,
        filters: data.filters,
        preferences: processedPreferences || data.preferences,
      });

      res.json(plan);
    } catch (error: any) {
      console.error("Error creating plan:", error);
      res.status(400).json({ 
        message: error.message || "Failed to create plan",
        details: error.issues || undefined
      });
    }
  });

  // Get a plan by ID
  app.get("/api/plans/:id", async (req, res) => {
    try {
      const plan = await storage.getPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.json(plan);
    } catch (error: any) {
      console.error("Error fetching plan:", error);
      res.status(500).json({ message: "Failed to fetch plan" });
    }
  });

  // Search venues near a plan's midpoint
  app.post("/api/plans/:id/venues", async (req, res) => {
    try {
      const plan = await storage.getPlan(req.params.id);
      if (!plan || !plan.midpoint) {
        return res.status(404).json({ message: "Plan not found or no midpoint calculated" });
      }

      const searchParams = searchVenuesSchema.parse({
        ...req.body,
        planId: req.params.id,
        location: plan.midpoint,
      });

      // Search venues using Google Places API
      console.log("Searching venues near:", searchParams.location, "radius:", searchParams.radius);
      const venuesFromAPI = await placesService.searchNearby({
        location: searchParams.location,
        radius: searchParams.radius,
        type: searchParams.type,
      });
      console.log(`Found ${venuesFromAPI.length} venues from Places API`);

      // Cache venues in database and analyze with AI
      const cachedVenues = await Promise.all(
        venuesFromAPI.map(async (venue) => {
          const cachedVenue = await storage.upsertVenue(venue);
          
          // Add AI analysis if not present
          if (!cachedVenue.aiAnalysis) {
            try {
              const analysis = await analyzeVenue(cachedVenue);
              await storage.updateVenue(cachedVenue.id, { aiAnalysis: analysis });
              return { ...cachedVenue, aiAnalysis: analysis };
            } catch (error) {
              console.warn("Failed to analyze venue:", error);
              return cachedVenue;
            }
          }
          
          return cachedVenue;
        })
      );

      // Calculate travel times for each participant
      const venuesWithTravelTimes = await Promise.all(
        cachedVenues.map(async (venue) => {
          const travelTimes = await Promise.all(
            plan.participants.map(async (participant) => {
              if (!participant.coordinates) return null;
              
              try {
                // For now, calculate straight-line distance as approximation
                const distance = calculateDistance(
                  participant.coordinates,
                  venue.coordinates
                );
                // Rough time estimate: assume 30 mph average speed
                const timeMinutes = Math.round((distance * 0.621371) / 30 * 60);
                
                return {
                  participantId: participant.id,
                  location: participant.location,
                  timeMinutes,
                  distance: Math.round(distance * 100) / 100, // Round to 2 decimals
                };
              } catch (error) {
                return null;
              }
            })
          );

          return {
            ...venue,
            travelTimes: travelTimes.filter(Boolean),
          };
        })
      );

      // Apply filters
      let filteredVenues = venuesWithTravelTimes;

      if (searchParams.minRating) {
        filteredVenues = filteredVenues.filter(v => 
          v.rating && parseFloat(v.rating) >= searchParams.minRating!
        );
      }

      if (searchParams.priceLevel?.length) {
        filteredVenues = filteredVenues.filter(v => 
          v.priceLevel !== null && searchParams.priceLevel!.includes(v.priceLevel)
        );
      }

      // Generate personalized recommendations if preferences exist
      if (plan.preferences?.naturalLanguageQuery) {
        try {
          const recommendations = await generatePersonalizedRecommendations(
            filteredVenues,
            plan.preferences,
            plan.participants.length
          );
          
          // Add AI recommendations to response
          const venuesWithAI = recommendations.map(rec => ({
            ...rec.venue,
            travelTimes: filteredVenues.find(v => v.id === rec.venue.id)?.travelTimes || [],
            aiRecommendation: {
              matchScore: rec.matchScore,
              reasoning: rec.reasoning,
              highlights: rec.highlights,
            },
          }));
          
          // Sort by AI match score
          venuesWithAI.sort((a, b) => (b.aiRecommendation?.matchScore || 0) - (a.aiRecommendation?.matchScore || 0));
          
          return res.json(venuesWithAI);
        } catch (error) {
          console.warn("Failed to generate AI recommendations:", error);
        }
      }

      // Sort by rating if no AI preferences
      filteredVenues.sort((a, b) => (parseFloat(b.rating || "0") - parseFloat(a.rating || "0")));
      res.json(filteredVenues);
    } catch (error: any) {
      console.error("Error searching venues:", error);
      res.status(400).json({ 
        message: error.message || "Failed to search venues",
        details: error.issues || undefined
      });
    }
  });

  // Update plan (add venues to itinerary, etc.)
  app.patch("/api/plans/:id", async (req, res) => {
    try {
      const updates = req.body;
      const updatedPlan = await storage.updatePlan(req.params.id, updates);
      res.json(updatedPlan);
    } catch (error: any) {
      console.error("Error updating plan:", error);
      res.status(500).json({ message: "Failed to update plan" });
    }
  });

  // Geocode an address
  app.post("/api/geocode", async (req, res) => {
    try {
      const { address } = req.body;
      if (!address) {
        return res.status(400).json({ message: "Address is required" });
      }

      const coordinates = await placesService.geocodeAddress(address);
      res.json({ coordinates });
    } catch (error: any) {
      console.error("Error geocoding address:", error);
      res.status(400).json({ message: "Failed to geocode address" });
    }
  });

  // Places autocomplete proxy
  app.post("/api/places/autocomplete", async (req, res) => {
    try {
      const { input } = req.body;
      if (!input || input.length < 3) {
        return res.json({ predictions: [] });
      }

      const suggestions = await placesService.autocomplete(input);
      res.json({ predictions: suggestions });
    } catch (error: any) {
      console.error("Error getting autocomplete suggestions:", error);
      res.status(400).json({ message: "Failed to get suggestions" });
    }
  });

  // Reverse geocoding proxy
  app.post("/api/places/reverse-geocode", async (req, res) => {
    try {
      const { lat, lng } = req.body;
      
      const latNum = Number(lat);
      const lngNum = Number(lng);
      
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        return res.status(400).json({ error: "Valid latitude and longitude required" });
      }

      const address = await placesService.reverseGeocode(latNum, lngNum);
      res.json({ address });
    } catch (error: any) {
      console.error("Error reverse geocoding:", error);
      res.status(400).json({ error: "Failed to reverse geocode location" });
    }
  });

  // Photo proxy to avoid API key exposure
  app.get("/api/places/photo", async (req, res) => {
    try {
      const { ref } = req.query;
      
      if (!ref || typeof ref !== 'string') {
        return res.status(400).json({ error: "Photo reference required" });
      }

      const photoUrl = await placesService.getPhotoUrl(ref);
      
      // Fetch the image and stream it to the client
      const response = await fetch(photoUrl);
      
      if (!response.ok) {
        return res.status(404).json({ error: "Photo not found" });
      }

      // Set appropriate headers
      res.set({
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      });
      
      // Stream the image data
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error: any) {
      console.error("Error fetching photo:", error);
      res.status(500).json({ error: "Failed to fetch photo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
