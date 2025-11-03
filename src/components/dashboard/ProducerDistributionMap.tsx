import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Producer } from '../../types/producer';
import { CooperativeInfo } from '../../types/cooperative';
import { Building2, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MAPBOX_TOKEN, mapStyles } from '../../utils/mapConfig';
import Map, { Marker, Popup } from 'react-map-gl';

interface ProducerCluster {
  coordinates: [number, number];
  producers: Producer[];
}

export default function ProducerDistributionMap() {
  const [clusters, setClusters] = useState<ProducerCluster[]>([]);
  const [cooperativeInfo, setCooperativeInfo] = useState<CooperativeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(mapStyles.streets);
  const [showMap, setShowMap] = useState(true);
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number;
    latitude: number;
    content: React.ReactNode;
  } | null>(null);
  const [viewState, setViewState] = useState({
    longitude: -4.2143906,
    latitude: 5.9309666,
    zoom: 8
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les informations de la coopérative
        const coopDoc = await getDoc(doc(db, 'cooperativeInfo', 'settings'));
        // Définir des valeurs par défaut même si les données n'existent pas
        const defaultCooperative = {
          name: 'SMARTCOOP',
          location: 'Abidjan',
          coordinates: [5.9309666, -4.2143906]
        };
        
        const coopData = coopDoc.exists() ? coopDoc.data() as CooperativeInfo : defaultCooperative;
        setCooperativeInfo(coopData);
        
        // Update view state if cooperative coordinates exist
        if (coopData.coordinates && coopData.coordinates.length === 2) {
          setViewState({
            longitude: coopData.coordinates[1],
            latitude: coopData.coordinates[0],
            zoom: 8
          });
        }

        // Fetch producers
        const producersQuery = query(
          collection(db, 'producers'),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(producersQuery);
        const producers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          joinDate: doc.data().joinDate?.toDate()
        })) as Producer[];

        // Group producers by location
        const groupedProducers = producers.reduce((acc, producer) => {
          if (!producer.coordinates) return acc;
          
          const key = producer.coordinates.join(',');
          if (!acc[key]) {
            acc[key] = {
              coordinates: producer.coordinates,
              producers: []
            };
          }
          acc[key].producers.push(producer);
          return acc;
        }, {} as Record<string, ProducerCluster>);

        setClusters(Object.values(groupedProducers));
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-card h-[500px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cooperativeInfo?.coordinates) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-card h-[500px] flex items-center justify-center">
        <p className="text-gray-500">Coordonnées de la coopérative non disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Distribution des producteurs</h3>
        <button
          onClick={() => setShowMap(!showMap)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showMap ? 'Masquer la carte' : 'Afficher la carte'}
        </button>
      </div>

      <div className={`transition-all duration-300 ease-in-out ${showMap ? 'h-[500px]' : 'h-0'} overflow-hidden`}>
        <div className="h-full rounded-lg overflow-hidden border border-gray-200 relative">
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            style={{ width: '100%', height: '100%' }}
            mapStyle={selectedTheme}
          >
            {/* Cooperative marker */}
            {cooperativeInfo && cooperativeInfo.coordinates && (
              <Marker
                longitude={cooperativeInfo.coordinates[1]}
                latitude={cooperativeInfo.coordinates[0]}
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setPopupInfo({
                    longitude: cooperativeInfo.coordinates[1],
                    latitude: cooperativeInfo.coordinates[0],
                    content: (
                      <div className="p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <h4 className="font-medium text-gray-900">{cooperativeInfo.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600">{cooperativeInfo.location}</p>
                      </div>
                    )
                  });
                }}
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
              </Marker>
            )}

            {/* Producer clusters */}
            {clusters.map((cluster, index) => (
              <Marker
                key={index}
                longitude={cluster.coordinates[1]}
                latitude={cluster.coordinates[0]}
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setPopupInfo({
                    longitude: cluster.coordinates[1],
                    latitude: cluster.coordinates[0],
                    content: (
                      <div className="p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-green-600" />
                          <h4 className="font-medium text-gray-900">
                            {cluster.producers.length} producteur{cluster.producers.length > 1 ? 's' : ''}
                          </h4>
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          {cluster.producers.map(producer => (
                            <div key={producer.id} className="text-sm py-1 border-t border-gray-100 first:border-0">
                              {producer.fullName}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  });
                }}
              >
                <div className="w-8 h-8 bg-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-sm font-medium">
                  {cluster.producers.length}
                </div>
              </Marker>
            ))}

            {/* Popup */}
            {popupInfo && (
              <Popup
                longitude={popupInfo.longitude}
                latitude={popupInfo.latitude}
                anchor="bottom"
                onClose={() => setPopupInfo(null)}
                closeButton={false}
              >
                {popupInfo.content}
              </Popup>
            )}

            {/* Map style selector */}
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

      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span className="text-sm text-gray-600">Siège de la coopérative</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-600"></div>
          <span className="text-sm text-gray-600">Producteurs</span>
        </div>
      </div>
    </div>
  );
}