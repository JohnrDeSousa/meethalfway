import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Filter, ArrowLeft } from "lucide-react";
import { VenueCard } from "@/components/VenueCard";
import { AdSenseBanner, AdSenseLeaderboard, AdSenseRectangle, AdSenseSkyscraper } from "@/components/AdSense";
import { MapView } from "@/components/MapView";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Plan, Venue, SearchFilters } from "@/types";

const VENUE_TYPES = [
  { value: "all", label: "All Types", icon: "🏢" },
  { value: "restaurant", label: "Restaurants", icon: "🍽️" },
  { value: "cafe", label: "Cafés", icon: "☕" },
  { value: "bar", label: "Bars", icon: "🍺" },
  { value: "park", label: "Parks", icon: "🌳" },
  { value: "trail", label: "Trails", icon: "🥾" },
];

export default function Results() {
  const { planId } = useParams<{ planId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<SearchFilters>({
    venueTypes: ["restaurant"], // Default to restaurants for better meetup suggestions
    minRating: 4.0,
    priceRange: [],
    maxDistance: 5,
  });

  // Fetch plan details
  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["/api/plans", planId],
    enabled: !!planId,
  });

  // Search venues with fallback logic for restaurant-first default
  const { data: venues = [], isLoading: venuesLoading, refetch: refetchVenues } = useQuery({
    queryKey: ["/api/plans", planId, "venues"],
    queryFn: async () => {
      // Try current filter first
      const primaryType = filters.venueTypes.length === 1 ? filters.venueTypes[0] : undefined;
      
      try {
        const response = await apiRequest("POST", `/api/plans/${planId}/venues`, {
          radius: filters.maxDistance * 1000, // Convert km to meters
          minRating: filters.minRating,
          type: primaryType,
        });
        const venues = await response.json() as Venue[];
        
        // If we got results, return them
        if (venues.length > 0) {
          return venues;
        }
        
        // If no results and we were searching for restaurants, try fallback sequence
        if (primaryType === "restaurant") {
          const fallbackTypes = ["cafe", "bar"];
          
          for (const fallbackType of fallbackTypes) {
            try {
              const fallbackResponse = await apiRequest("POST", `/api/plans/${planId}/venues`, {
                radius: filters.maxDistance * 1000,
                minRating: filters.minRating,
                type: fallbackType,
              });
              const fallbackVenues = await fallbackResponse.json() as Venue[];
              
              if (fallbackVenues.length > 0) {
                // Update filters to show the fallback type that worked
                setFilters(prev => ({ ...prev, venueTypes: [fallbackType] }));
                
                toast({
                  title: "No restaurants found",
                  description: `Showing ${fallbackType === "cafe" ? "cafés" : "bars"} instead`,
                });
                
                return fallbackVenues;
              }
            } catch (fallbackError) {
              console.warn(`Fallback search for ${fallbackType} failed:`, fallbackError);
            }
          }
        }
        
        return venues; // Return empty array if all fallbacks failed
      } catch (error) {
        console.error("Venue search failed:", error);
        return [] as Venue[];
      }
    },
    enabled: !!plan?.midpoint,
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (updates: Partial<Plan>) => {
      const response = await apiRequest("PATCH", `/api/plans/${planId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans", planId] });
    },
  });

  // Refetch venues when filters change
  useEffect(() => {
    if (plan?.midpoint) {
      refetchVenues();
    }
  }, [filters, refetchVenues, plan?.midpoint]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleVenueType = (venueType: string) => {
    if (venueType === "all") {
      updateFilter("venueTypes", []);
    } else {
      const current = filters.venueTypes;
      const updated = current.includes(venueType)
        ? current.filter(t => t !== venueType)
        : [...current, venueType];
      updateFilter("venueTypes", updated);
    }
  };

  const addToItinerary = (venueId: string) => {
    if (!plan) return;
    
    const currentSelected = plan.selectedVenues || [];
    const updated = currentSelected.includes(venueId)
      ? currentSelected.filter(id => id !== venueId)
      : [...currentSelected, venueId];

    updatePlanMutation.mutate({ selectedVenues: updated });
    
    toast({
      title: currentSelected.includes(venueId) ? "Removed from plan" : "Added to plan",
      description: currentSelected.includes(venueId) 
        ? "Venue removed from your itinerary" 
        : "Venue added to your itinerary",
    });
  };

  if (planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Plan not found</h1>
            <p className="text-muted-foreground mb-4">The meeting plan you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/")} data-testid="button-home">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/")}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold text-foreground">Halfway Meet</h1>
              </div>
            </div>
            <Button variant="outline" size="sm" data-testid="button-share-plan">
              Share Plan
            </Button>
          </div>
        </div>
      </header>

      {/* Top Banner Ad */}
      <div className="py-4 bg-muted/5">
        <AdSenseLeaderboard 
          slot="2222222222" 
          className="max-w-7xl mx-auto" 
        />
      </div>

      {/* Results Section */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Great spots near your midpoint</h2>
            <p className="text-muted-foreground">
              Midway between {plan.participants.map(p => p.location).join(", ")}
            </p>
          </div>

          {/* Filters Bar */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex flex-wrap gap-2">
                {VENUE_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant={
                      type.value === "all" 
                        ? filters.venueTypes.length === 0 ? "default" : "secondary"
                        : filters.venueTypes.includes(type.value) ? "default" : "secondary"
                    }
                    size="sm"
                    onClick={() => toggleVenueType(type.value)}
                    className="text-sm"
                    data-testid={`filter-${type.value}`}
                  >
                    <span className="mr-2">{type.icon}</span>
                    {type.label}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center space-x-3 ml-auto">
                <Select
                  value={filters.minRating.toString()}
                  onValueChange={(value) => updateFilter("minRating", parseFloat(value))}
                >
                  <SelectTrigger className="w-40" data-testid="select-rating">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3.0">Rating ≥ 3.0</SelectItem>
                    <SelectItem value="4.0">Rating ≥ 4.0</SelectItem>
                    <SelectItem value="4.5">Rating ≥ 4.5</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={filters.maxDistance.toString()}
                  onValueChange={(value) => updateFilter("maxDistance", parseInt(value))}
                >
                  <SelectTrigger className="w-40" data-testid="select-distance">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Within 2km</SelectItem>
                    <SelectItem value="5">Within 5km</SelectItem>
                    <SelectItem value="10">Within 10km</SelectItem>
                    <SelectItem value="20">Within 20km</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="sm" data-testid="button-filters">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Map View */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="sticky top-24 space-y-4">
                <MapView 
                  midpoint={plan.midpoint}
                  venues={venues}
                  participants={plan.participants}
                />
                
                {/* Sidebar Ad */}
                <AdSenseRectangle 
                  slot="3333333333" 
                  className="hidden lg:block" 
                />
              </div>
            </div>

            {/* Venue List */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              {venuesLoading ? (
                <div className="space-y-6">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="p-6">
                      <div className="flex space-x-4">
                        <div className="w-32 h-32 bg-muted rounded-lg animate-pulse" />
                        <div className="flex-1 space-y-3">
                          <div className="h-6 bg-muted rounded animate-pulse" />
                          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : venues.length === 0 ? (
                <Card className="p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">No venues found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search radius to find more options.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setFilters({
                      venueTypes: [],
                      minRating: 3.0,
                      priceRange: [],
                      maxDistance: 10,
                    })}
                    data-testid="button-reset-filters"
                  >
                    Reset Filters
                  </Button>
                </Card>
              ) : (
                <div className="space-y-6">
                  {venues
                    .filter((venue) => {
                      // Filter by venue types if any are selected
                      if (filters.venueTypes.length > 0) {
                        return filters.venueTypes.some(selectedType => {
                          const venueCategory = venue.category?.toLowerCase().replace(/[éèêë]/g, 'e') || '';
                          const filterType = selectedType.toLowerCase();
                          
                          // Handle different category variations
                          if (filterType === 'cafe' || filterType === 'cafes') {
                            return venueCategory.includes('cafe') || venueCategory.includes('coffee') || venueCategory.includes('tea');
                          }
                          if (filterType === 'restaurant') {
                            return venueCategory.includes('restaurant') || venueCategory.includes('food') || venueCategory.includes('dining');
                          }
                          if (filterType === 'bar') {
                            return venueCategory.includes('bar') || venueCategory.includes('pub') || venueCategory.includes('lounge');
                          }
                          
                          // Default exact match
                          return venueCategory.includes(filterType);
                        });
                      }
                      return true; // Show all if no filters selected
                    })
                    .map((venue) => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                      plan={plan}
                      onAddToItinerary={() => addToItinerary(venue.id)}
                      isSelected={plan.selectedVenues?.includes(venue.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
