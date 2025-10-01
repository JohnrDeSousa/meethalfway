export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Participant {
  id: string;
  location: string;
  coordinates?: Coordinates;
}

export interface Plan {
  id: string;
  participants: Participant[];
  midpoint?: Coordinates;
  selectedVenues: string[];
  filters?: {
    venueTypes?: string[];
    minRating?: number;
    priceRange?: string[];
    maxDistance?: number;
  };
  title?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Venue {
  id: string;
  name: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  address: string;
  coordinates: Coordinates;
  openingHours?: string[];
  photos?: string[];
  website?: string;
  phoneNumber?: string;
  isOpenNow?: boolean;
  features?: string[];
  travelTimes?: Array<{
    participantId: string;
    location: string;
    timeMinutes: number;
    distance: number;
  }>;
}

export interface SearchFilters {
  venueTypes: string[];
  minRating: number;
  priceRange: string[];
  maxDistance: number;
}
