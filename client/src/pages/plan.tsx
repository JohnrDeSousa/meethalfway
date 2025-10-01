import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star, ArrowLeft, Calendar, Share, Download } from "lucide-react";
import { VenueCard } from "@/components/VenueCard";
import { ShareDialog } from "@/components/ShareDialog";
import { useState } from "react";
import type { Plan, Venue } from "@/types";

export default function PlanPage() {
  const { planId } = useParams<{ planId: string }>();
  const [, setLocation] = useLocation();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  // Get highlighted venue from URL if present
  const searchParams = new URLSearchParams(window.location.search);
  const highlightedVenueId = searchParams.get("venue");

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["/api/plans", planId],
    enabled: !!planId,
  });

  const { data: selectedVenues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ["/api/venues", plan?.selectedVenues],
    queryFn: async () => {
      if (!plan?.selectedVenues?.length) return [];
      const response = await fetch(`/api/venues?ids=${plan.selectedVenues.join(",")}`);
      return response.json() as Promise<Venue[]>;
    },
    enabled: !!plan?.selectedVenues?.length,
  });

  const generateCalendarFile = () => {
    if (!plan || !selectedVenues.length) return;

    const venue = selectedVenues[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Tomorrow
    startDate.setHours(18, 0, 0, 0); // 6 PM

    const endDate = new Date(startDate);
    endDate.setHours(20, 0, 0, 0); // 8 PM

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Halfway Meet//EN",
      "BEGIN:VEVENT",
      `UID:${plan.id}-${venue.id}@halfwaymeet.app`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:Meeting at ${venue.name}`,
      `DESCRIPTION:Meeting organized via Halfway Meet\\n\\nVenue: ${venue.name}\\nAddress: ${venue.address}\\n\\nView plan: ${window.location.origin}/plan/${plan.id}`,
      `LOCATION:${venue.address}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-${venue.name.replace(/[^a-zA-Z0-9]/g, "-")}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                onClick={() => setLocation(`/results/${planId}`)}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Results
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold text-foreground">Meeting Plan</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {selectedVenues.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={generateCalendarFile}
                  data-testid="button-export-calendar"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to Calendar
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowShareDialog(true)}
                data-testid="button-share-plan"
              >
                <Share className="w-4 h-4 mr-2" />
                Share Plan
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Plan Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              {plan.title || "Meeting Plan"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Participants</h3>
                <div className="space-y-2">
                  {plan.participants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm" data-testid={`text-participant-${index}`}>
                        {participant.location}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Meeting Point</h3>
                {plan.midpoint ? (
                  <div className="text-sm text-muted-foreground" data-testid="text-midpoint">
                    Latitude: {plan.midpoint.lat.toFixed(4)}<br />
                    Longitude: {plan.midpoint.lng.toFixed(4)}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Calculating midpoint...</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Venues */}
        {selectedVenues.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Itinerary</h2>
              <Badge variant="secondary" data-testid="text-venue-count">
                {selectedVenues.length} venue{selectedVenues.length !== 1 ? "s" : ""} selected
              </Badge>
            </div>
            
            {selectedVenues.map((venue, index) => (
              <div 
                key={venue.id}
                className={highlightedVenueId === venue.id ? "ring-2 ring-primary rounded-xl" : ""}
              >
                <VenueCard
                  venue={venue}
                  plan={plan}
                  onAddToItinerary={() => {}} // Read-only in plan view
                  isSelected={true}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No venues selected yet</h3>
              <p className="text-muted-foreground mb-6">
                Browse venues and add them to your plan to create a shared itinerary
              </p>
              <Button 
                onClick={() => setLocation(`/results/${planId}`)}
                data-testid="button-browse-venues"
              >
                Browse Venues
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Share Dialog */}
        {selectedVenue && (
          <ShareDialog
            isOpen={showShareDialog}
            onClose={() => {
              setShowShareDialog(false);
              setSelectedVenue(null);
            }}
            venue={selectedVenue}
            planId={plan.id}
          />
        )}
      </div>
    </div>
  );
}
