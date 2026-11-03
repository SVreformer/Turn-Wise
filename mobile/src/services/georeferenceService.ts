import { Coordinates } from './localRouter';

export interface GpsLocation {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
}

/**
 * Georeferencing Engine for KSR Bengaluru Railway Station
 * Transforms Real-World WGS84 GPS (Latitude, Longitude) into Station SVG Map Coordinates (x, y)
 * and vice-versa.
 */
export class GeoreferenceService {
  // Station Center Reference
  public readonly refLat: number = 12.9781;
  public readonly refLng: number = 77.5695;

  // Station Boundary in WGS84
  public readonly stationBounds = {
    minLat: 12.9740,
    maxLat: 12.9830,
    minLng: 77.5640,
    maxLng: 77.5740
  };

  // Affine Transformation Weights derived from station CAD anchors
  private readonly wx = [617891.75, 325247.02, 1295.24];
  private readonly wy = [-64819.89, -416524.40, 906.33];

  // SVG coordinate boundary limits
  public readonly mapWidth = 3456;
  public readonly mapHeight = 1728;

  /**
   * Convert real-world GPS (lat, lng) to station map coordinates (x, y)
   */
  public gpsToStationCoordinates(gps: GpsLocation): Coordinates | null {
    const { latitude, longitude } = gps;

    // Check if within reasonable proximity of KSR Bengaluru station (~1.2 km)
    const dLat = latitude - this.refLat;
    const dLng = longitude - this.refLng;

    const approxDistMeters = Math.sqrt(
      Math.pow(dLat * 110574, 2) + Math.pow(dLng * 108476, 2)
    );

    if (approxDistMeters > 1500) {
      // User is far outside the station
      return null;
    }

    // Affine transformation
    const rawX = this.wx[0] * dLng + this.wx[1] * dLat + this.wx[2];
    const rawY = this.wy[0] * dLng + this.wy[1] * dLat + this.wy[2];

    // Clamp coordinates safely within station footprint
    const clampedX = Math.max(120, Math.min(this.mapWidth - 120, Math.round(rawX * 10) / 10));
    const clampedY = Math.max(80, Math.min(this.mapHeight - 80, Math.round(rawY * 10) / 10));

    return {
      x: clampedX,
      y: clampedY
    };
  }

  /**
   * Convert station map coordinates (x, y) back to approximate real-world GPS
   */
  public stationCoordinatesToGps(coords: Coordinates): { latitude: number; longitude: number } {
    const dx = coords.x - this.wx[2];
    const dy = coords.y - this.wy[2];

    const det = this.wx[0] * this.wy[1] - this.wx[1] * this.wy[0];
    const dLng = (this.wy[1] * dx - this.wx[1] * dy) / det;
    const dLat = (-this.wy[0] * dx + this.wx[0] * dy) / det;

    return {
      latitude: Math.round((this.refLat + dLat) * 1000000) / 1000000,
      longitude: Math.round((this.refLng + dLng) * 1000000) / 1000000
    };
  }

  /**
   * Check if user is physically inside or nearby KSR Bengaluru station perimeter
   */
  public isInsideStationPerimeter(latitude: number, longitude: number): boolean {
    return (
      latitude >= this.stationBounds.minLat &&
      latitude <= this.stationBounds.maxLat &&
      longitude >= this.stationBounds.minLng &&
      longitude <= this.stationBounds.maxLng
    );
  }

  /**
   * Calculate distance in metres from station center
   */
  public getDistanceToStationCenterMeters(latitude: number, longitude: number): number {
    const dLat = (latitude - this.refLat) * 110574;
    const dLng = (longitude - this.refLng) * 108476;
    return Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
  }
}

export const georeferenceService = new GeoreferenceService();

