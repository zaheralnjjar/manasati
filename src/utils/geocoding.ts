// Reverse Geocoding Utility for Masari
// Converts coordinates to human-readable street addresses

interface GeocodingResult {
    address: {
        road?: string;
        house_number?: string;
        neighbourhood?: string;
        suburb?: string;
        city?: string;
        state?: string;
        country?: string;
    };
    display_name: string;
}

/**
 * Reverse geocode coordinates to get street address
 * @param lat Latitude
 * @param lng Longitude
 * @returns Street address string or null if failed
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
            {
                headers: {
                    'User-Agent': 'Minasati App'
                }
            }
        );

        if (!response.ok) {
            console.error('Reverse geocoding failed:', response.statusText);
            return null;
        }

        const data: GeocodingResult = await response.json();

        // Build address string
        const parts: string[] = [];

        if (data.address.road) {
            parts.push(data.address.road);
        }

        if (data.address.house_number) {
            parts.push(data.address.house_number);
        }

        if (data.address.neighbourhood || data.address.suburb) {
            parts.push(data.address.neighbourhood || data.address.suburb || '');
        }

        if (data.address.city) {
            parts.push(data.address.city);
        }

        // If we have specific parts, use them
        if (parts.length > 0) {
            return parts.filter(p => p).join(', ');
        }

        // Otherwise, use display name
        return data.display_name || null;

    } catch (error) {
        console.error('Error in reverse geocoding:', error);
        return null;
    }
}

/**
 * Format coordinates as fallback when geocoding fails
 */
export function formatCoordinates(lat: number, lng: number): string {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
