import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Expand, MapPin, Star } from "lucide-react";
import L from "leaflet";
import type { Coordinates, Venue, Participant } from "@/types";

// Fix for default markers in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const midpointIcon = L.divIcon({
  className: 'custom-midpoint-marker',
  html: '<div class="w-6 h-6 bg-primary rounded-full border-4 border-primary-foreground shadow-lg"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const venueIcon = L.divIcon({
  className: 'custom-venue-marker',
  html: '<div class="w-4 h-4 bg-accent rounded-full border-2 border-accent-foreground shadow-md"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface MapViewProps {
  midpoint?: Coordinates;
  venues?: Venue[];
  participants?: Participant[];
  selectedVenueId?: string;
  onVenueSelect?: (venueId: string) => void;
}

// Component to fit map bounds when data changes
function MapBounds({ midpoint, venues }: { midpoint?: Coordinates; venues: Venue[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (!midpoint) return;
    
    const bounds = L.latLngBounds([]);
    
    // Add midpoint to bounds
    bounds.extend([midpoint.lat, midpoint.lng]);
    
    // Add venues to bounds
    venues.forEach(venue => {
      if (venue.coordinates) {
        bounds.extend([venue.coordinates.lat, venue.coordinates.lng]);
      }
    });
    
    // Fit map to bounds with padding
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, midpoint, venues]);
  
  return null;
}

export function MapView({ 
  midpoint, 
  venues = [], 
  participants = [],
  selectedVenueId,
  onVenueSelect 
}: MapViewProps) {
  if (!midpoint) {
    return (
      <Card className="h-96">
        <CardContent className="p-0 relative h-full">
          <div className="h-full rounded-xl border border-border relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No location data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-96">
      <CardContent className="p-0 relative h-full">
        {/* Map Controls */}
        <div className="absolute top-4 left-4 bg-card border px-3 py-2 rounded-lg shadow-sm z-[1000]">
          <div className="text-sm font-medium text-foreground">Midpoint</div>
          <div className="text-xs text-muted-foreground" data-testid="text-midpoint-coords">
            {midpoint.lat.toFixed(4)}, {midpoint.lng.toFixed(4)}
          </div>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 right-4 z-[1000]"
          data-testid="button-expand-map"
        >
          <Expand className="w-4 h-4" />
        </Button>

        <MapContainer
          center={[midpoint.lat, midpoint.lng]}
          zoom={13}
          className="h-full w-full rounded-xl"
          data-testid="interactive-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Midpoint Marker */}
          <Marker 
            position={[midpoint.lat, midpoint.lng]} 
            icon={midpointIcon}
            data-testid="marker-midpoint"
          >
            <Popup>
              <div className="text-sm">
                <strong>Meeting Point</strong>
                <br />
                {midpoint.lat.toFixed(6)}, {midpoint.lng.toFixed(6)}
              </div>
            </Popup>
          </Marker>
          
          {/* Venue Markers */}
          {venues.map((venue) => {
            if (!venue.coordinates) return null;
            
            return (
              <Marker
                key={venue.id}
                position={[venue.coordinates.lat, venue.coordinates.lng]}
                icon={venueIcon}
                data-testid={`marker-venue-${venue.id}`}
                eventHandlers={{
                  click: () => {
                    if (onVenueSelect) {
                      onVenueSelect(venue.id);
                    }
                  },
                }}
              >
                <Popup>
                  <div className="text-sm min-w-48">
                    <strong className="block mb-1">{venue.name}</strong>
                    <div className="text-muted-foreground mb-2">
                      {venue.category} • {venue.priceLevel && '💰'.repeat(venue.priceLevel)}
                    </div>
                    {venue.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{venue.rating}</span>
                      </div>
                    )}
                    {venue.address && (
                      <div className="text-xs text-muted-foreground">
                        {venue.address}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
          
          {/* Component to handle bounds fitting */}
          <MapBounds midpoint={midpoint} venues={venues} />
        </MapContainer>
        
        {/* Venue Count Display */}
        <div className="absolute bottom-4 left-4 right-4 bg-card border p-3 rounded-lg text-xs text-muted-foreground text-center z-[1000]">
          Showing {venues.length} venues near your midpoint
        </div>
      </CardContent>
    </Card>
  );
}