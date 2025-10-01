interface Coordinates {
  lat: number;
  lng: number;
}

export function calculateMidpoint(coordinates: Coordinates[]): Coordinates {
  if (coordinates.length === 0) {
    throw new Error("At least one coordinate is required");
  }

  if (coordinates.length === 1) {
    return coordinates[0];
  }

  // For 2 points, use simple midpoint
  if (coordinates.length === 2) {
    return {
      lat: (coordinates[0].lat + coordinates[1].lat) / 2,
      lng: (coordinates[0].lng + coordinates[1].lng) / 2,
    };
  }

  // For 3+ points, use centroid calculation
  // Convert to Cartesian coordinates for better accuracy
  let x = 0, y = 0, z = 0;

  coordinates.forEach(coord => {
    const latRad = (coord.lat * Math.PI) / 180;
    const lngRad = (coord.lng * Math.PI) / 180;

    x += Math.cos(latRad) * Math.cos(lngRad);
    y += Math.cos(latRad) * Math.sin(lngRad);
    z += Math.sin(latRad);
  });

  x /= coordinates.length;
  y /= coordinates.length;
  z /= coordinates.length;

  const centralLng = Math.atan2(y, x);
  const centralSqrt = Math.sqrt(x * x + y * y);
  const centralLat = Math.atan2(z, centralSqrt);

  return {
    lat: (centralLat * 180) / Math.PI,
    lng: (centralLng * 180) / Math.PI,
  };
}

export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  // Haversine formula for distance in kilometers
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) * Math.cos((coord2.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
