import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, X, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  "data-testid"?: string;
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function LocationPicker({ 
  label, 
  value, 
  onChange, 
  onRemove,
  "data-testid": testIdProp
}: LocationPickerProps) {
  const { toast } = useToast();
  
  // Helper to create valid HTML IDs from labels
  const createValidId = (text: string): string => {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };
  
  const validId = createValidId(label);
  const testId = testIdProp || `input-${validId}`;
  const listboxId = `listbox-${validId}`;
  const getOptionId = (index: number) => `option-${validId}-${index}`;
  
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounced search function
  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch("/api/places/autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: query }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.predictions && data.predictions.length > 0) {
          setSuggestions(data.predictions);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    } catch (error) {
      console.error("Places autocomplete error:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion: PlaceSuggestion) => {
    onChange(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        const suggestionContainer = document.getElementById(listboxId);
        if (suggestionContainer && !suggestionContainer.contains(event.target as Node)) {
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [label]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocode to get address via server-side proxy
          const response = await fetch("/api/places/reverse-geocode", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              lat: position.coords.latitude, 
              lng: position.coords.longitude 
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.address) {
              onChange(data.address);
            } else {
              onChange(`${position.coords.latitude}, ${position.coords.longitude}`);
            }
          } else {
            onChange(`${position.coords.latitude}, ${position.coords.longitude}`);
          }
        } catch (error) {
          onChange(`${position.coords.latitude}, ${position.coords.longitude}`);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        toast({
          title: "Location access denied",
          description: "Please allow location access or enter your address manually",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Label htmlFor={`location-${validId}`} className="block text-sm font-medium text-foreground mb-2">
          {label}
        </Label>
        <div className="relative">
          <Input
            ref={inputRef}
            id={`location-${validId}`}
            type="text"
            placeholder="Start typing an address..."
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => value.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
            className="pr-16 autocomplete-input"
            data-testid={testId}
            autoComplete="off"
            aria-label={label}
            aria-describedby={showSuggestions ? listboxId : undefined}
            aria-controls={showSuggestions ? listboxId : undefined}
            aria-activedescendant={showSuggestions && selectedIndex >= 0 ? getOptionId(selectedIndex) : undefined}
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            role="combobox"
          />
          
          {/* Search indicator */}
          {isSearching && (
            <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          {/* Location button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            data-testid={`${testId}-location-button`}
            aria-label="Use current location"
          >
            {isLoading ? (
              <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
<MapPin className="h-3 w-3" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Autocomplete suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <Card 
            id={listboxId}
            className="absolute top-full left-0 right-0 z-50 mt-1 border shadow-lg bg-card max-h-80 overflow-y-auto"
            data-testid={`${testId}-suggestions`}
            role="listbox"
            aria-label={`${label} suggestions`}
          >
            <CardContent className="p-0">
              {suggestions.map((suggestion, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={suggestion.place_id}
                    ref={el => suggestionRefs.current[index] = el}
                    className={`px-4 py-3.5 cursor-pointer transition-all duration-150 border-b border-border/30 last:border-b-0 ${
                      isSelected 
                        ? '!bg-primary !text-primary-foreground shadow-sm' 
                        : 'hover:!bg-accent hover:!border-accent hover:!text-accent-foreground'
                    }`}
                    onClick={() => selectSuggestion(suggestion)}
                    data-testid={`${testId}-suggestion-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    id={getOptionId(index)}
                  >
                  <div className="flex items-start space-x-3">
                    <MapPin className={`w-4 h-4 mt-1 flex-shrink-0 ${
                      index === selectedIndex 
                        ? 'text-primary-foreground/80' 
                        : 'text-muted-foreground'
                    }`} aria-hidden="true" />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className={`font-semibold truncate leading-5 ${
                        index === selectedIndex 
                          ? 'text-primary-foreground' 
                          : 'text-foreground'
                      }`}>
                        {suggestion.structured_formatting.main_text}
                      </div>
                      <div className={`text-sm truncate leading-4 ${
                        index === selectedIndex 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}>
                        {suggestion.structured_formatting.secondary_text}
                      </div>
                    </div>
                    {index === selectedIndex && (
                      <div className="text-xs text-primary-foreground/80 font-medium px-2 py-1 bg-primary-foreground/10 rounded-md">
                        Enter
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
      
      {onRemove && (
        <div className="flex items-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive"
            data-testid={`${testId}-remove-button`}
            aria-label="Remove participant"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
