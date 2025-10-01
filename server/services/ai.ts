import OpenAI from "openai";
import type { Venue } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIPreferences {
  naturalLanguageQuery?: string;
  dietaryRestrictions?: string[];
  accessibility?: string[];
  mood?: string;
  activityType?: string;
  timeOfDay?: string;
  groupSize?: number;
  budget?: string;
}

export interface VenueAnalysis {
  ambiance?: string;
  goodFor?: string[];
  bestTimeToVisit?: string;
  crowdLevel?: string;
  atmosphereScore?: number;
  personalityMatch?: number;
}

export interface PersonalizedRecommendation {
  venue: Venue;
  matchScore: number;
  reasoning: string;
  highlights: string[];
}

/**
 * Analyzes user preferences from natural language input
 */
export async function parseUserPreferences(input: string): Promise<AIPreferences> {
  try {
    const prompt = `Parse the following user preferences for finding meeting spots and extract structured information. 
    
User input: "${input}"

Extract the following information if mentioned:
- Dietary restrictions (vegetarian, vegan, gluten-free, etc.)
- Accessibility needs (wheelchair accessible, hearing friendly, etc.)
- Mood/atmosphere (casual, formal, romantic, energetic, quiet, etc.)
- Activity type (dining, coffee, drinks, entertainment, outdoor, etc.)
- Time preferences (morning, lunch, afternoon, evening, late night)
- Budget level (budget-friendly, moderate, upscale, luxury)

Respond with JSON in this exact format:
{
  "dietaryRestrictions": ["string array or empty"],
  "accessibility": ["string array or empty"],
  "mood": "string or null",
  "activityType": "string or null", 
  "timeOfDay": "string or null",
  "budget": "string or null"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      naturalLanguageQuery: input,
      dietaryRestrictions: parsed.dietaryRestrictions || [],
      accessibility: parsed.accessibility || [],
      mood: parsed.mood || undefined,
      activityType: parsed.activityType || undefined,
      timeOfDay: parsed.timeOfDay || undefined,
      budget: parsed.budget || undefined,
    };
  } catch (error) {
    console.error("Failed to parse user preferences:", error);
    // Return basic preferences with just the original query
    return {
      naturalLanguageQuery: input,
      dietaryRestrictions: [],
      accessibility: [],
    };
  }
}

/**
 * Analyzes a venue to extract AI-enhanced insights
 */
export async function analyzeVenue(venue: Venue): Promise<VenueAnalysis> {
  try {
    const prompt = `Analyze this venue and provide insights about its characteristics:

Venue: ${venue.name}
Category: ${venue.category || "Unknown"}
Rating: ${venue.rating || "N/A"}
Price Level: ${venue.priceLevel ? "$".repeat(venue.priceLevel) : "N/A"}
Address: ${venue.address || "N/A"}
Features: ${venue.features?.join(", ") || "None listed"}

Based on this information, provide:
1. Ambiance description (cozy, modern, traditional, etc.)
2. What types of activities/occasions it's good for
3. Best time of day to visit
4. Expected crowd level (quiet, moderate, busy)
5. Atmosphere score (1-10 scale)

Respond with JSON in this exact format:
{
  "ambiance": "string description",
  "goodFor": ["activity1", "activity2"],
  "bestTimeToVisit": "time description",
  "crowdLevel": "quiet/moderate/busy",
  "atmosphereScore": number_between_1_and_10
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      ambiance: analysis.ambiance,
      goodFor: analysis.goodFor || [],
      bestTimeToVisit: analysis.bestTimeToVisit,
      crowdLevel: analysis.crowdLevel,
      atmosphereScore: Math.max(1, Math.min(10, analysis.atmosphereScore || 5)),
    };
  } catch (error) {
    console.error("Failed to analyze venue:", error);
    return {
      atmosphereScore: 5,
      goodFor: [],
    };
  }
}

/**
 * Generates personalized venue recommendations based on user preferences
 */
export async function generatePersonalizedRecommendations(
  venues: Venue[],
  preferences: AIPreferences,
  groupSize?: number
): Promise<PersonalizedRecommendation[]> {
  try {
    const venueData = venues.map(v => ({
      id: v.id,
      name: v.name,
      category: v.category,
      rating: v.rating,
      priceLevel: v.priceLevel,
      features: v.features,
      aiAnalysis: v.aiAnalysis,
    }));

    const prompt = `You are an expert meeting spot recommender. Analyze these venues and rank them based on user preferences.

Venues: ${JSON.stringify(venueData, null, 2)}

User Preferences:
- Natural Language Query: "${preferences.naturalLanguageQuery || ""}"
- Dietary Restrictions: ${preferences.dietaryRestrictions?.join(", ") || "None"}
- Accessibility Needs: ${preferences.accessibility?.join(", ") || "None"}
- Desired Mood: ${preferences.mood || "Any"}
- Activity Type: ${preferences.activityType || "Any"}
- Time of Day: ${preferences.timeOfDay || "Any"}
- Budget: ${preferences.budget || "Any"}
- Group Size: ${groupSize || "Not specified"}

For each venue, provide:
1. Match score (0-100) based on how well it fits the preferences
2. Brief reasoning for the score
3. Key highlights that make it suitable

Respond with JSON array in this exact format:
[
  {
    "venueId": "venue_id",
    "matchScore": number_0_to_100,
    "reasoning": "brief explanation",
    "highlights": ["highlight1", "highlight2"]
  }
]

Sort by match score descending.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "[]");
    const recommendations = Array.isArray(result) ? result : result.recommendations || [];
    
    return recommendations
      .map((rec: any) => {
        const venue = venues.find(v => v.id === rec.venueId);
        if (!venue) return null;
        
        return {
          venue,
          matchScore: Math.max(0, Math.min(100, rec.matchScore || 0)),
          reasoning: rec.reasoning || "Good match for your preferences",
          highlights: rec.highlights || [],
        };
      })
      .filter((rec): rec is PersonalizedRecommendation => rec !== null)
      .sort((a, b) => b.matchScore - a.matchScore);
      
  } catch (error) {
    console.error("Failed to generate personalized recommendations:", error);
    // Return basic scoring based on rating and features
    return venues.map(venue => ({
      venue,
      matchScore: Math.round((parseFloat(venue.rating || "3") / 5) * 100),
      reasoning: "Standard recommendation based on rating",
      highlights: venue.features?.slice(0, 2) || [],
    })).sort((a, b) => b.matchScore - a.matchScore);
  }
}

/**
 * Generates natural language explanation for venue selection
 */
export async function explainVenueChoice(
  venue: Venue,
  preferences: AIPreferences,
  matchScore: number
): Promise<string> {
  try {
    const prompt = `Explain in a friendly, conversational way why this venue is recommended for the user.

Venue: ${venue.name}
Category: ${venue.category}
Match Score: ${matchScore}%
User Preferences: "${preferences.naturalLanguageQuery}"

Write a brief, engaging explanation (2-3 sentences) about why this venue fits their needs.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || 
           `${venue.name} seems like a great choice for your group!`;
           
  } catch (error) {
    console.error("Failed to generate venue explanation:", error);
    return `${venue.name} looks like a great spot for your meetup!`;
  }
}