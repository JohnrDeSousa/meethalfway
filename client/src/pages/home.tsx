import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Plus, Users, Clock, Star, Sparkles, MessageSquare } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import type { Participant, Plan } from "@/types";
import { AdSenseBanner, AdSenseLeaderboard, AdSenseRectangle } from "@/components/AdSense";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", location: "" },
    { id: "2", location: "" }
  ]);
  const [preferences, setPreferences] = useState("");

  const createPlanMutation = useMutation({
    mutationFn: async (planData: { participants: Participant[]; preferences?: any }) => {
      const response = await apiRequest("POST", "/api/plans", planData);
      return response.json() as Promise<Plan>;
    },
    onSuccess: (plan) => {
      setLocation(`/results/${plan.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create meeting plan",
        variant: "destructive",
      });
    },
  });

  const addParticipant = () => {
    if (participants.length < 10) {
      setParticipants([...participants, { 
        id: Date.now().toString(), 
        location: "" 
      }]);
    }
  };

  const removeParticipant = (id: string) => {
    if (participants.length > 2) {
      setParticipants(participants.filter(p => p.id !== id));
    }
  };

  const updateParticipant = (id: string, location: string) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, location } : p
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validParticipants = participants.filter(p => p.location.trim());
    if (validParticipants.length < 2) {
      toast({
        title: "Error",
        description: "Please enter at least 2 locations",
        variant: "destructive",
      });
      return;
    }

    createPlanMutation.mutate({ 
      participants: validParticipants,
      preferences: preferences.trim() ? { naturalLanguageQuery: preferences.trim() } : undefined
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center" aria-hidden="true">
                <MapPin className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Halfway Meet</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" data-testid="button-signin">
                <Users className="w-4 h-4 mr-2" aria-hidden="true" />
                Sign In
              </Button>
              <Button size="sm" data-testid="button-premium">
                Go Premium
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Top Banner Ad */}
      <AdSenseLeaderboard 
        slot="1234567890" 
        className="hidden md:block" 
      />
      <AdSenseBanner 
        slot="0987654321" 
        className="block md:hidden" 
      />

      {/* Hero Section */}
      <main>
        <section className="hero-gradient py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Find the perfect meeting spot, halfway between everyone
            </h2>
            <p className="text-xl text-white/95 mb-12 max-w-2xl mx-auto">
              Enter locations, discover amazing venues at your midpoint, and get directions for everyone.
            </p>
          
          {/* Location Input Form */}
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {participants.map((participant, index) => (
                    <LocationPicker
                      key={participant.id}
                      label={index === 0 ? "Your location" : index === 1 ? "Their location" : `Person ${index + 1} location`}
                      value={participant.location}
                      onChange={(location) => updateParticipant(participant.id, location)}
                      onRemove={participants.length > 2 ? () => removeParticipant(participant.id) : undefined}
                      data-testid={`input-location-${index}`}
                    />
                  ))}
                  
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addParticipant}
                      disabled={participants.length >= 10}
                      className="text-primary hover:text-primary/80"
                      data-testid="button-add-participant"
                      aria-label={`Add participant (${participants.length} of 10)`}
                    >
                      <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                      Add another person
                    </Button>
                    
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <input 
                        id="time-aware-midpoint"
                        type="checkbox" 
                        className="rounded border-border" 
                        aria-describedby="pro-feature-badge"
                      />
                      <label htmlFor="time-aware-midpoint" className="flex items-center cursor-pointer">
                        Time-aware midpoint
                        <span id="pro-feature-badge" className="ml-1 text-xs bg-accent text-accent-foreground px-2 py-1 rounded" aria-label="Premium feature">PRO</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* AI Preferences Section */}
                <div className="border-t border-border pt-6 space-y-4">
                  <div className="flex items-center space-x-2 text-lg font-medium text-foreground">
                    <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
                    <span>Smart Recommendations</span>
                    <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded" aria-label="AI-powered feature">AI</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="preferences-input" className="flex items-center text-sm font-medium text-foreground">
                      <MessageSquare className="w-4 h-4 mr-2" aria-hidden="true" />
                      Tell us what you're looking for
                    </label>
                    <Textarea
                      id="preferences-input"
                      placeholder="e.g., 'A quiet coffee shop for working, vegetarian options, wheelchair accessible' or 'Fun bar with outdoor seating for after-work drinks'"
                      value={preferences}
                      onChange={(e) => setPreferences(e.target.value)}
                      className="min-h-[80px] resize-none"
                      data-testid="textarea-preferences"
                      aria-describedby="preferences-help"
                    />
                    <p id="preferences-help" className="text-xs text-muted-foreground">
                      Our AI will analyze your preferences to suggest the most suitable venues with personalized explanations.
                    </p>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={createPlanMutation.isPending}
                  data-testid="button-find-spots"
                  aria-describedby="plan-status"
                >
                  {createPlanMutation.isPending ? "Finding Meeting Spots..." : "Find Meeting Spots"}
                </Button>
                <div id="plan-status" className="sr-only" aria-live="polite" aria-atomic="true">
                  {createPlanMutation.isPending ? "Searching for meeting spots..." : ""}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        </section>
      </main>

      {/* Mid-page Ad */}
      <div className="py-8 bg-muted/10">
        <AdSenseRectangle 
          slot="5555555555" 
          className="mx-auto" 
        />
      </div>

      {/* Features Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Midpoint</h3>
              <p className="text-muted-foreground">Calculates the perfect meeting point based on everyone's location</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Great Venues</h3>
              <p className="text-muted-foreground">Discover highly-rated restaurants, cafés, parks, and more nearby</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Directions</h3>
              <p className="text-muted-foreground">Get personalized directions for each person via Apple or Google Maps</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-footer Ad */}
      <div className="py-8 bg-background">
        <AdSenseBanner 
          slot="7777777777" 
          className="max-w-4xl mx-auto" 
        />
      </div>

      {/* Footer */}
      <footer className="bg-muted/30 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Halfway Meet</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Find the perfect meeting spot, halfway between everyone.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">How it works</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Premium features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API access</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy policy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-3">Connect</h4>
              <div className="flex space-x-3">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Twitter
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Facebook
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Halfway Meet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
