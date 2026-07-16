import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface LatLng {
  lat: number
  lng: number
}

/**
 * Parses the Site.gpsCoordinates string (stored as "lat, lng") into numbers.
 * Returns null if the field is empty, malformed, or out of valid range.
 */
export function parseGpsCoordinates(value: string | null | undefined): LatLng | null {
  if (!value) return null

  const parts = value.split(",").map((p) => p.trim())
  if (parts.length !== 2) return null

  const lat = parseFloat(parts[0])
  const lng = parseFloat(parts[1])

  if (Number.isNaN(lat) || Number.isNaN(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null

  return { lat, lng }
}

/** Formats a lat/lng pair back into the "lat, lng" string stored on Site.gpsCoordinates. */
export function formatGpsCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}
