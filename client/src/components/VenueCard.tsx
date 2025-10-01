import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, Phone, Globe, Calendar, Heart, Share, Plus } from "lucide-react";
import { ShareDialog } from "./ShareDialog";
import { DirectionsDialog } from "./DirectionsDialog";
import { useState } from "react";
import { generateOpenTableUrl } from "@/lib/places";
import type { Venue, Plan } from "@/types";

interface VenueCardProps {
  venue: Venue;
  plan: Plan;
  onAddToItinerary: () => void;
  isSelected?: boolean;
}

export function VenueCard({ venue, plan, onAddToItinerary, isSelected }: VenueCardProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDirectionsDialog, setShowDirectionsDialog] = useState(false);

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="w-3 h-3 fill-yellow-400/50 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="w-3 h-3 text-gray-300" />);
      }
    }
    
    return <div className="flex">{stars}</div>;
  };

  const getPriceDisplay = (priceLevel?: number) => {
    if (priceLevel === null || priceLevel === undefined) return "Free";
    return "$".repeat(Math.max(1, priceLevel));
  };

  const getOpenStatus = () => {
    if (venue.isOpenNow === true) return "Open now";
    if (venue.isOpenNow === false) return "Closed";
    return "Hours unknown";
  };

  const handleReservation = () => {
    const openTableUrl = generateOpenTableUrl(venue.name, venue.address);
    window.open(openTableUrl, "_blank");
  };

  return (
    <>
      <Card className="venue-card hover:shadow-md transition-shadow" data-testid={`card-venue-${venue.id}`}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Venue Image */}
            {venue.photos?.[0] && (
              <img
                src={venue.photos[0]}
                alt={venue.name}
                className="w-full sm:w-32 h-32 rounded-lg object-cover"
                data-testid={`img-venue-${venue.id}`}
              />
            )}
            
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-lg font-semibold text-foreground" data-testid={`text-venue-name-${venue.id}`}>
                    {venue.name}
                  </h4>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span data-testid={`text-venue-category-${venue.id}`}>{venue.category}</span>
                    <span>•</span>
                    <span data-testid={`text-venue-price-${venue.id}`}>{getPriceDisplay(venue.priceLevel)}</span>
                    <span>•</span>
                    <span className={venue.isOpenNow ? "text-accent" : "text-muted-foreground"}>
                      {getOpenStatus()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-accent"
                  data-testid={`button-favorite-${venue.id}`}
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>

              {/* Rating */}
              {venue.rating && (
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex items-center">
                    {renderStars(venue.rating)}
                    <span className="ml-2 text-sm font-medium" data-testid={`text-venue-rating-${venue.id}`}>
                      {venue.rating}
                    </span>
                    {venue.reviewCount && (
                      <span className="ml-1 text-sm text-muted-foreground" data-testid={`text-venue-reviews-${venue.id}`}>
                        ({venue.reviewCount.toLocaleString()})
                      </span>
                    )}
                  </div>
                  {venue.features && venue.features.length > 0 && (
                    <div className="flex space-x-2">
                      {venue.features.slice(0, 2).map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Travel Times */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Travel times:</div>
                  <div className="space-y-1">
                    {venue.travelTimes?.map((travel, index) => (
                      <div key={travel.participantId} data-testid={`text-travel-time-${venue.id}-${index}`}>
                        {plan.participants.find(p => p.id === travel.participantId)?.location.split(',')[0] || `Person ${index + 1}`}: 
                        {" "}{travel.timeMinutes} min
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Distance from midpoint:</div>
                  <div data-testid={`text-venue-distance-${venue.id}`}>
                    {venue.travelTimes?.[0]?.distance?.toFixed(1) || "0.0"} km
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowDirectionsDialog(true)}
                  data-testid={`button-directions-${venue.id}`}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Directions
                </Button>
                
                {venue.category?.toLowerCase().includes("restaurant") && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleReservation}
                    className="bg-accent text-accent-foreground"
                    data-testid={`button-reserve-${venue.id}`}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Reserve
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowShareDialog(true)}
                  data-testid={`button-share-${venue.id}`}
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
                
                <Button
                  size="sm"
                  variant={isSelected ? "default" : "secondary"}
                  onClick={onAddToItinerary}
                  data-testid={`button-itinerary-${venue.id}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isSelected ? "Added to Plan" : "Add to Plan"}
                </Button>
              </div>

              {/* Contact Info */}
              {(venue.phoneNumber || venue.website) && (
                <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                  {venue.phoneNumber && (
                    <a 
                      href={`tel:${venue.phoneNumber}`}
                      className="flex items-center hover:text-foreground transition-colors"
                      data-testid={`link-phone-${venue.id}`}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      {venue.phoneNumber}
                    </a>
                  )}
                  {venue.website && (
                    <a 
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-foreground transition-colors"
                      data-testid={`link-website-${venue.id}`}
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      Website
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <DirectionsDialog
        isOpen={showDirectionsDialog}
        onClose={() => setShowDirectionsDialog(false)}
        venue={venue}
        participants={plan.participants}
      />

      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        venue={venue}
        planId={plan.id}
      />
    </>
  );
}
