import React, { useState, useCallback, useEffect } from 'react';
import Map, { Marker, Source, Layer, NavigationControl, Popup } from 'react-map-gl';
import type { LineLayer } from 'react-map-gl';
import { Building2 } from 'lucide-react';
import { Producer } from '../../types/producer';
import { CooperativeInfo } from '../../types/cooperative';
import { MAPBOX_TOKEN, mapStyles, customMapStyle } from '../../utils/mapConfig';
import { RouteCalculator } from '../../services/routing/RouteCalculator';

interface RouteMapProps {
  producers: Producer[];
  cooperative: CooperativeInfo;
  showRoute?: boolean;
  startLocation?: string;
  endLocation?: string;
  useCooperativeAsStart?: boolean;
  useCooperativeAsEnd?: boolean;
}

export default function RouteMap({ 
  producers, 
  cooperative, 
  showRoute = true,
  startLocation,
  endLocation,
  useCooperativeAsStart = true,
  useCooperativeAsEnd = true
}: RouteMapProps) {
  const [mapStyle, setMapStyle] = useState(mapStyles.streets);
  const [popupInfo, setPopupInfo] = useState<{
    lngLat: [number, number];
    content: React.ReactNode;
  } | null>(null);
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeDuration, setRouteDuration] = useState(0);

  const routeLayer: LineLayer = {
    id: 'route',
    type: 'line',
    paint: {
      'line-color': customMapStyle.route.color,
      'line-width': customMapStyle.route.width,
      'line-opacity': customMapStyle.route.opacity
    }
  };

  const getRouteData = useCallback(() => {
    if (!showRoute || producers.length === 0) return null;

    // Déterminer les points de départ et d'arrivée
    const startPoint = useCooperativeAsStart ? 
      [cooperative.coordinates[1], cooperative.coordinates[0]] : 
      [producers[0].coordinates[1], producers[0].coordinates[0]];
    
    const endPoint = useCooperativeAsEnd ? 
      [cooperative.coordinates[1], cooperative.coordinates[0]] : 
      [producers[producers.length - 1].coordinates[1], producers[producers.length - 1].coordinates[0]];

    // Créer la liste des points dans l'ordre
    const coordinates = [startPoint];
    
    // Ajouter tous les arrêts
    producers.forEach(producer => {
      coordinates.push([producer.coordinates[1], producer.coordinates[0]]);
    });
    
    // Ajouter le point d'arrivée si différent du dernier arrêt
    if (coordinates[coordinates.length - 1][0] !== endPoint[0] || 
        coordinates[coordinates.length - 1][1] !== endPoint[1]) {
      coordinates.push(endPoint);
    }

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates
      }
    };
  }, [producers, cooperative, showRoute, useCooperativeAsStart, useCooperativeAsEnd]);

  useEffect(() => {
    // Calculer la distance et la durée de l'itinéraire
    if (producers.length > 0) {
      const distance = RouteCalculator.calculateTotalDistance([
        cooperative.coordinates,
        ...producers.map(p => p.coordinates)
      ]);
      setRouteDistance(distance);
      setRouteDuration(RouteCalculator.estimateDuration(distance));
    }
  }, [producers, cooperative]);

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border border-gray-200 relative">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: cooperative.coordinates[1],
          latitude: cooperative.coordinates[0],
          zoom: 12
        }}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />

        {/* Cooperative marker */}
        <Marker
          longitude={cooperative.coordinates[1]}
          latitude={cooperative.coordinates[0]}
          onClick={e => {
            e.originalEvent.stopPropagation();
            setPopupInfo({
              lngLat: [cooperative.coordinates[1], cooperative.coordinates[0]],
              content: (
                <div className="p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-[#2F5E1E]" />
                    <h4 className="font-medium text-gray-900">{cooperative.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{cooperative.location}</p>
                </div>
              )
            });
          }}
        >
          <div 
            style={{
              width: customMapStyle.cooperative.size,
              height: customMapStyle.cooperative.size,
              backgroundColor: customMapStyle.cooperative.color,
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              cursor: 'pointer'
            }}
          />
        </Marker>

        {/* Producer markers */}
        {producers.map((producer) => (
          <Marker
            key={producer.id}
            longitude={producer.coordinates[1]}
            latitude={producer.coordinates[0]}
            onClick={e => {
              e.originalEvent.stopPropagation();
              setPopupInfo({
                lngLat: [producer.coordinates[1], producer.coordinates[0]],
                content: (
                  <div className="p-2">
                    <h4 className="font-medium text-gray-900">{producer.fullName}</h4>
                    <p className="text-sm text-gray-600">{producer.address}</p>
                  </div>
                )
              });
            }}
          >
            <div 
              style={{
                width: customMapStyle.producer.size,
                height: customMapStyle.producer.size,
                backgroundColor: customMapStyle.producer.color,
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                cursor: 'pointer'
              }}
            />
          </Marker>
        ))}

        {/* Route line */}
        {showRoute && producers.length > 0 && (
          <Source type="geojson" data={getRouteData() as any}>
            <Layer {...routeLayer} />
          </Source>
        )}

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.lngLat[0]}
            latitude={popupInfo.lngLat[1]}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeButton={false}
          >
            {popupInfo.content}
          </Popup>
        )}

        {/* Map style control */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
          <div className="flex items-center gap-2 px-3 py-2">
            <select
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value)}
              className="text-sm border-none focus:ring-0 bg-transparent"
            >
              <option value={mapStyles.streets}>Rues</option>
              <option value={mapStyles.satellite}>Satellite</option>
              <option value={mapStyles.light}>Clair</option>
              <option value={mapStyles.dark}>Sombre</option>
              <option value={mapStyles.outdoors}>Terrain</option>
            </select>
          </div>
        </div>

        {/* Distance and duration info */}
        {showRoute && producers.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
            <div className="text-sm">
              <div className="font-medium">Distance: {Math.round(routeDistance)} km</div>
              <div className="font-medium">Durée: {Math.floor(routeDuration / 60)}h{Math.round(routeDuration % 60).toString().padStart(2, '0')}</div>
            </div>
          </div>
        )}
      </Map>
    </div>
  );
}