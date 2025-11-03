import { toast } from 'react-hot-toast';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export interface GeocodingResult {
  label: string;
  lat: number;
  lon: number;
}

export async function searchLocation(query: string): Promise<GeocodingResult[]> {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'Accept-Language': 'fr',
        }
      }
    );

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    return data.map((result: any) => ({
      label: result.display_name,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon)
    }));
  } catch (error) {
    console.error('Error searching location:', error);
    toast.error('Erreur lors de la recherche de la localisation');
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'Accept-Language': 'fr',
        }
      }
    );

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    return {
      label: data.display_name,
      lat: parseFloat(data.lat),
      lon: parseFloat(data.lon)
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    toast.error('Erreur lors de la récupération de l\'adresse');
    return null;
  }
}