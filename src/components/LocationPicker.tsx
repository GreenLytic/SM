import React, { useState, useCallback } from 'react';
import Map, { Marker } from 'react-map-gl';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { MAPBOX_TOKEN, mapStyles } from '../utils/mapConfig';
import { searchLocation, reverseGeocode, GeocodingResult } from '../services/geocoding';
import { toast } from 'react-hot-toast';

interface LocationPickerProps {
  value: string;
  onChange: (address: string, coordinates: [number, number]) => void;
}

const INITIAL_CENTER: [number, number] = [6.6111, 20.9394];

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(true);
  const [position, setPosition] = useState<[number, number]>(INITIAL_CENTER);
  const [selectedTheme, setSelectedTheme] = useState(mapStyles.streets);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    try {
      if (!searchQuery.trim() || isSearching) return;
      
      setIsSearching(true);
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: GeocodingResult) => {
    const newPosition: [number, number] = [result.lat, result.lon];
    setPosition(newPosition);
    onChange(result.label, newPosition);
    setSearchQuery(result.label);
    setShowResults(false);
  };

  const handleMapClick = useCallback(async (event: any) => {
    try {
      const newPosition: [number, number] = [event.lngLat.lat, event.lngLat.lng];
      setPosition(newPosition);
      const result = await reverseGeocode(newPosition[0], newPosition[1]);
      
      if (result) {
        onChange(result.label, newPosition);
        setSearchQuery(result.label);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      toast.error('Erreur lors de la récupération de l\'adresse');
    }
  }, [onChange]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 ${
            isSearching ? 'text-blue-500 animate-spin' : 'text-gray-400'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.length > 2) {
                handleSearch();
              }
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Rechercher une localité ou cliquer sur la carte"
            className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0"
                >
                  {result.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {showMap ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>Masquer la carte</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>Afficher la carte</span>
            </>
          )}
        </button>
      </div>

      {value && (
        <div className="p-2 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-900">{value}</p>
        </div>
      )}

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        showMap ? 'h-[300px] opacity-100' : 'h-0 opacity-0'
      }`}>
        <div className="h-full rounded-lg overflow-hidden border border-gray-200 relative">
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{
              longitude: position[1],
              latitude: position[0],
              zoom: 12
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle={selectedTheme}
            onClick={handleMapClick}
          >
            <Marker
              longitude={position[1]}
              latitude={position[0]}
              draggable
              onDragEnd={async (event) => {
                const newPosition: [number, number] = [event.lngLat.lat, event.lngLat.lng];
                setPosition(newPosition);
                const result = await reverseGeocode(newPosition[0], newPosition[1]);
                if (result) {
                  onChange(result.label, newPosition);
                  setSearchQuery(result.label);
                }
              }}
            >
              <div className="w-8 h-8 bg-[#2F5E1E] rounded-full border-2 border-white shadow-lg" />
            </Marker>

            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="text-sm border-none focus:ring-0 bg-transparent"
              >
                <option value={mapStyles.streets}>Rues</option>
                <option value={mapStyles.satellite}>Satellite</option>
                <option value={mapStyles.light}>Clair</option>
                <option value={mapStyles.dark}>Sombre</option>
                <option value={mapStyles.outdoors}>Terrain</option>
              </select>
            </div>
          </Map>
        </div>
      </div>
    </div>
  );
}