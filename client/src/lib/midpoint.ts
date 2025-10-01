import type { Coordinates } from "@/types";

export function calculateMidpoint(coordinates: Coordinates[]): Coordinates {
  if (coordinates.length === 0) {
    throw new Error("At least one coordinate is required");
  }

  if (coordinates.length === 1) {
    return coordinates[0];
  }

  // Simple centroid calculation for client-side preview
  const lat = coordinates.reduce((sum, coord) => sum + coord.lat, 0) / coordinates.length;
  const lng = coordinates.reduce((sum, coord) => sum + coord.lng, 0) / coordinates.length;

  return { lat, lng };
}
