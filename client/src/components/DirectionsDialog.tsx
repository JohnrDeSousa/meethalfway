import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { generateAppleMapsUrl, generateGoogleMapsUrl } from "@/lib/places";
import type { Venue, Participant } from "@/types";

interface DirectionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  venue: Venue;
  participants: Participant[];
}

export function DirectionsDialog({ isOpen, onClose, venue, participants }: DirectionsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="dialog-directions">
        <DialogHeader>
          <DialogTitle>Get Directions to {venue.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Choose your preferred maps app:
          </div>
          
          <div className="space-y-3">
            {participants.map((participant, index) => (
              participant.coordinates && (
                <Card key={participant.id} className="border">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-foreground mb-2" data-testid={`text-participant-${index}`}>
                      From {participant.location.split(',')[0] || `Location ${index + 1}`}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="text-xs"
                        data-testid={`link-apple-maps-${participant.id}`}
                      >
                        <a
                          href={generateAppleMapsUrl(participant.coordinates, venue.coordinates)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="mr-2">🍎</span>
                          Apple Maps
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        className="text-xs"
                        data-testid={`link-google-maps-${participant.id}`}
                      >
                        <a
                          href={generateGoogleMapsUrl(participant.coordinates, venue.coordinates)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="mr-2">🌐</span>
                          Google Maps
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>

          <div className="pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              <strong>Venue Address:</strong><br />
              {venue.address}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
