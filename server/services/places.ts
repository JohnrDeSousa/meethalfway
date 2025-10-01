interface PlaceSearchParams {
  location: { lat: number; lng: number };
  radius: number;
  type?: string;
}

interface PlaceDetails {
  id: string;
  name: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  address: string;
  coordinates: { lat: number; lng: number };
  openingHours?: string[];
  photos?: string[];
  website?: string;
  phoneNumber?: string;
  isOpenNow?: boolean;
  features?: string[];
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export class PlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.PLACES_API_KEY || "";
    if (!this.apiKey) {
      console.warn("Google Places API key not found. Places functionality will be limited.");
    } else {
      console.log("Google Places API key loaded successfully");
    }
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    if (!this.apiKey) {
      throw new Error("Google Places API key not configured");
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== "OK" || !data.results?.length) {
        throw new Error(`No results found for address: ${address}`);
      }

      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    } catch (error) {
      console.error("Geocoding error:", error);
      throw new Error("Failed to geocode address");
    }
  }

  async searchNearby(params: PlaceSearchParams): Promise<PlaceDetails[]> {
    if (!this.apiKey) {
      throw new Error("Google Places API key not configured");
    }

    try {
      // Use Places API Nearby Search
      const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
      searchUrl.searchParams.set("location", `${params.location.lat},${params.location.lng}`);
      searchUrl.searchParams.set("radius", params.radius.toString());
      searchUrl.searchParams.set("key", this.apiKey);
      
      if (params.type) {
        searchUrl.searchParams.set("type", this.mapVenueType(params.type));
      }

      const response = await fetch(searchUrl.toString());

      if (!response.ok) {
        throw new Error(`Places API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "ZERO_RESULTS") {
        console.log("No places found for location:", params.location, "radius:", params.radius);
        return []; // Return empty array instead of throwing error
      }
      
      if (data.status !== "OK") {
        console.error("Places API error details:", data.error_message || data.status);
        throw new Error(`Places API returned status: ${data.status}`);
      }

      const places = await Promise.all(
        data.results.slice(0, 20).map(async (place: any) => {
          // Get additional details for each place
          const details = await this.getPlaceDetails(place.place_id);
          
          return {
            id: place.place_id,
            name: place.name,
            category: this.categorizePlace(place.types),
            rating: place.rating,
            reviewCount: place.user_ratings_total,
            priceLevel: place.price_level,
            address: place.vicinity,
            coordinates: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
            isOpenNow: place.opening_hours?.open_now,
            photos: place.photos?.slice(0, 3).map((photo: any) => 
              `/api/places/photo?ref=${photo.photo_reference}`
            ),
            ...details,
          };
        })
      );

      return places;
    } catch (error) {
      console.error("Places search error:", error);
      throw new Error("Failed to search places");
    }
  }

  async autocomplete(input: string): Promise<PlaceSuggestion[]> {
    if (!this.apiKey) {
      return this.getFallbackSuggestions(input);
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${this.apiKey}&types=address`
      );

      if (!response.ok) {
        console.warn(`Places API error: ${response.status}, falling back to mock suggestions`);
        return this.getFallbackSuggestions(input);
      }

      const data = await response.json();

      if (data.status !== "OK") {
        console.warn(`Places API returned status: ${data.status}, falling back to mock suggestions`);
        return this.getFallbackSuggestions(input);
      }

      return data.predictions?.slice(0, 5) || [];
    } catch (error) {
      console.warn("Places autocomplete error, falling back to mock suggestions:", error);
      return this.getFallbackSuggestions(input);
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (!this.apiKey) {
      // Provide a fallback address for the general location
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`
      );

      if (!response.ok) {
        console.warn(`Reverse geocoding API error: ${response.status}, falling back to coordinates`);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      const data = await response.json();

      if (data.status !== "OK" || !data.results?.length) {
        console.warn(`Reverse geocoding API returned status: ${data.status}, falling back to coordinates`);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      return data.results[0].formatted_address;
    } catch (error) {
      console.warn("Reverse geocoding error, falling back to coordinates:", error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  getPhotoUrl(photoReference: string): string {
    if (!this.apiKey) {
      return "";
    }
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${this.apiKey}`;
  }

  private getFallbackSuggestions(input: string): PlaceSuggestion[] {
    const mockSuggestions = [
      {
        place_id: "mock_1",
        description: "1600 Amphitheatre Parkway, Mountain View, CA, USA",
        structured_formatting: {
          main_text: "1600 Amphitheatre Parkway",
          secondary_text: "Mountain View, CA, USA"
        }
      },
      {
        place_id: "mock_2", 
        description: "Times Square, New York, NY, USA",
        structured_formatting: {
          main_text: "Times Square",
          secondary_text: "New York, NY, USA"
        }
      },
      {
        place_id: "mock_3",
        description: "Golden Gate Bridge, San Francisco, CA, USA", 
        structured_formatting: {
          main_text: "Golden Gate Bridge",
          secondary_text: "San Francisco, CA, USA"
        }
      },
      {
        place_id: "mock_4",
        description: "Central Park, New York, NY, USA",
        structured_formatting: {
          main_text: "Central Park", 
          secondary_text: "New York, NY, USA"
        }
      },
      {
        place_id: "mock_5",
        description: "Hollywood Sign, Los Angeles, CA, USA",
        structured_formatting: {
          main_text: "Hollywood Sign",
          secondary_text: "Los Angeles, CA, USA"
        }
      }
    ];

    return mockSuggestions.filter(suggestion => 
      suggestion.description.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5);
  }

  private async getPlaceDetails(placeId: string): Promise<Partial<PlaceDetails>> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,formatted_phone_number,website,opening_hours&key=${this.apiKey}`
      );

      if (!response.ok) {
        return {};
      }

      const data = await response.json();

      if (data.status !== "OK") {
        return {};
      }

      const result = data.result;
      return {
        address: result.formatted_address,
        phoneNumber: result.formatted_phone_number,
        website: result.website,
        openingHours: result.opening_hours?.weekday_text,
      };
    } catch (error) {
      console.error("Place details error:", error);
      return {};
    }
  }

  private mapVenueType(venueType: string): string {
    const typeMap: Record<string, string> = {
      restaurant: "restaurant",
      cafe: "cafe",
      bar: "bar",
      park: "park",
      trail: "park",
      museum: "museum",
      entertainment: "amusement_park",
    };

    return typeMap[venueType.toLowerCase()] || "establishment";
  }

  private categorizePlace(types: string[]): string {
    const categoryMap: Record<string, string> = {
      restaurant: "Restaurant",
      food: "Restaurant", 
      cafe: "Café",
      bar: "Bar",
      night_club: "Bar",
      park: "Park",
      amusement_park: "Entertainment",
      museum: "Museum",
      tourist_attraction: "Attraction",
      shopping_mall: "Shopping",
      store: "Shopping",
    };

    for (const type of types) {
      if (categoryMap[type]) {
        return categoryMap[type];
      }
    }

    return "Other";
  }
}
