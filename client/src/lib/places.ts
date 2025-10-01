import { apiRequest } from "./queryClient";
import type { Coordinates } from "@/types";

export async function geocodeAddress(address: string): Promise<Coordinates> {
  const response = await apiRequest("POST", "/api/geocode", { address });
  const data = await response.json();
  return data.coordinates;
}

export function generateAppleMapsUrl(origin: Coordinates, destination: Coordinates): string {
  return `http://maps.apple.com/?saddr=${origin.lat},${origin.lng}&daddr=${destination.lat},${destination.lng}&dirflg=d`;
}

export function generateGoogleMapsUrl(origin: Coordinates, destination: Coordinates): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
}

export function generateOpenTableUrl(venueName: string, venueAddress: string): string {
  const query = encodeURIComponent(`${venueName} ${venueAddress}`);
  return `https://www.opentable.com/s?term=${query}`;
}
