import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CollectionRoute, RouteStop } from '../../types/route';
import { Producer } from '../../types/producer';
import { CooperativeInfo } from '../../types/cooperative';
import { Employee } from '../../types/employee';
import { Collection } from '../../types/collection';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { 
  Calendar, Clock, Users, Truck, MapPin, Package, 
  FileText, Download, Fuel, Receipt, MessageSquare
} from 'lucide-react';
import RouteCompletedReportPDF from './RouteCompletedReportPDF';
import { RouteCalculator } from '../../services/routing/RouteCalculator';

interface RouteCompletedReportProps {
  routeId: string;
  onClose: () => void;
}

export default function RouteCompletedReport({ routeId, onClose }: RouteCompletedReportProps) {
  const [route, setRoute] = useState<CollectionRoute | null>(null);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [cooperative, setCooperative] = useState<CooperativeInfo | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer les données de la route
        const routeDoc = await getDoc(doc(db, 'routes', routeId));
        if (!routeDoc.exists()) {
          throw new Error('Route not found');
        }
        
        const routeData = {
          id: routeDoc.id,
          ...routeDoc.data(),
          date: routeDoc.data().date?.toDate(),
          completedAt: routeDoc.data().completedAt?.toDate()
        } as CollectionRoute;
        
        setRoute(routeData);
        
        // Récupérer les informations de la coopérative
        const coopDoc = await getDoc(doc(db, 'cooperativeInfo', 'settings'));
        // Définir des valeurs par défaut même si les données n'existent pas
        const defaultCooperative = {
          name: 'SMARTCOOP',
          location: 'Abidjan',
          coordinates: [5.9309666, -4.2143906]
        };
        
        setCooperative(coopDoc.exists() ? coopDoc.data() as CooperativeInfo : defaultCooperative);
        
        // Récupérer les producteurs
        const producerIds = routeData.stops.map(stop => stop.producerId);
        if (producerIds.length > 0) {
          const producersQuery = query(collection(db, 'producers'));
          const producersSnapshot = await getDocs(producersQuery);
          const producersData = producersSnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              joinDate: doc.data().joinDate?.toDate()
            }) as Producer)
            .filter(producer => producerIds.includes(producer.id!));
          
          setProducers(producersData);
        }
        
        // Fetch collections related to this route
        const collectionsQuery = query(
          collection(db, 'collections'),
          where('routeId', '==', routeId)
        );
        const collectionsSnapshot = await getDocs(collectionsQuery);
        const collectionsData = collectionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate()
        })) as Collection[];
        
        setCollections(collectionsData);
        
        // Fetch employees
        const employeesQuery = query(collection(db, 'employees'));
        const employeesSnapshot = await getDocs(employeesQuery);
        const employeesData = employeesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Employee[];
        
        setEmployees(employeesData);
        
      } catch (error) {
        console.error('Error fetching route data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [routeId]);
  
  useEffect(() => {
    // Calculate route distance and duration when data is available
    if (route && producers.length > 0 && cooperative) {
      const routeDistance = RouteCalculator.calculateRouteDistance(route, producers, cooperative);
      setDistance(routeDistance);
      setDuration(RouteCalculator.estimateDuration(routeDistance));
    }
  }, [route, producers, cooperative]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!route || !cooperative) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Données de la tournée non disponibles</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Fermer
        </button>
      </div>
    );
  }

  const getProducerName = (producerId: string): string => {
    const producer = producers.find(p => p.id === producerId);
    return producer?.fullName || 'Producteur inconnu';
  };

  const getProducerPhone = (producerId: string): string => {
    const producer = producers.find(p => p.id === producerId);
    return producer?.phone || 'N/A';
  };

  const getCollectionForStop = (producerId: string): Collection | undefined => {
    return collections.find(c => c.producerId === producerId);
  };

  const getParticipantNames = (): string => {
    if (!route.participants || route.participants.length === 0) {
      return 'Aucun';
    }
    
    return route.participants.join(', ');
  };

  const getCompletedStops = (): RouteStop[] => {
    return route.stops.filter(stop => stop.status === 'completed');
  };

  const getTotalCollectedWeight = (): number => {
    return getCompletedStops().reduce((sum, stop) => sum + (stop.estimatedQuantity || 0), 0);
  };

  const getVillagesList = (): string => {
    const locations = route.stops.map(stop => stop.location);
    const uniqueLocations = [...new Set(locations)];
    return uniqueLocations.join(', ');
  };

  // Estimate fuel consumption (8L/100km)
  const estimateFuelConsumption = (): number => {
    return (distance * 8) / 100;
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto p-6">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-semibold text-gray-900">Rapport de tournée</h2>
        <div className="flex gap-2">
          <PDFDownloadLink
            document={
              <RouteCompletedReportPDF
                route={route}
                producers={producers}
                cooperative={cooperative}
                collections={collections}
                distance={distance}
                duration={duration}
              />
            }
            fileName={`rapport-tournee-${format(route.date, 'yyyyMMdd')}-${route.name.toLowerCase().replace(/\s+/g, '-')}.pdf`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {({ loading }) => (
              <>
                <Download className="w-5 h-5" />
                <span>{loading ? 'Génération...' : 'Télécharger PDF'}</span>
              </>
            )}
          </PDFDownloadLink>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* 1. Informations Générales */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Informations générales</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Date de la tournée:</span>
                <span className="font-medium">{format(route.date, 'dd MMMM yyyy', { locale: fr })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Heure de départ:</span>
                <span className="font-medium">{route.startTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Heure d'arrivée:</span>
                <span className="font-medium">{route.endTime || '18:00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Chauffeur:</span>
                <span className="font-medium">{route.driver}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Accompagnants:</span>
                <span className="font-medium">{getParticipantNames()}</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Villages visités:</span>
                <span className="font-medium">{getVillagesList()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre d'arrêts:</span>
                <span className="font-medium">{route.stops.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Arrêts complétés:</span>
                <span className="font-medium">{getCompletedStops().length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantité totale collectée:</span>
                <span className="font-medium">{getTotalCollectedWeight().toFixed(2)} tonnes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date de complétion:</span>
                <span className="font-medium">
                  {route.completedAt ? format(route.completedAt, 'dd MMMM yyyy', { locale: fr }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Détails par producteur */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-medium text-gray-900">Détails par producteur</h3>
        </div>
        
        <div className="space-y-4">
          {route.stops.map((stop, index) => {
            const collection = getCollectionForStop(stop.producerId);
            
            return (
              <div key={index} className={`p-4 rounded-lg border ${
                stop.status === 'completed' ? 'border-green-200 bg-green-50' :
                stop.status === 'cancelled' ? 'border-red-200 bg-red-50' :
                'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{getProducerName(stop.producerId)}</h4>
                    <p className="text-sm text-gray-600">Tél: {getProducerPhone(stop.producerId)}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    stop.status === 'completed' ? 'bg-green-100 text-green-800' :
                    stop.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {stop.status === 'completed' ? 'Complété' :
                     stop.status === 'cancelled' ? 'Annulé' : 'En attente'}
                  </span>
                </div>
                
                {stop.status === 'completed' && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Quantité collectée:</span>
                          <span className="text-sm font-medium">
                            {stop.estimatedQuantity?.toFixed(2) || 'N/A'} tonnes
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Qualité:</span>
                          <span className="text-sm font-medium">
                            {stop.quality || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Humidité:</span>
                          <span className="text-sm font-medium">
                            {stop.humidity ? `${stop.humidity}%` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Heure de collecte:</span>
                          <span className="text-sm font-medium">
                            {collection?.date ? format(collection.date, 'HH:mm', { locale: fr }) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Mode de paiement:</span>
                          <span className="text-sm font-medium">À définir</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Notes:</span>
                          <span className="text-sm font-medium">
                            {stop.notes || 'Aucune'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {stop.status === 'cancelled' && (
                  <div className="mt-3">
                    <p className="text-sm text-red-600">
                      Raison: {stop.notes || 'Non spécifiée'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Données logistiques */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Données logistiques</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Distance totale parcourue:</span>
                <span className="font-medium">{Math.round(distance)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Durée totale estimée:</span>
                <span className="font-medium">
                  {Math.floor(duration / 60)}h{Math.round(duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Consommation carburant estimée:</span>
                <span className="font-medium">{estimateFuelConsumption().toFixed(2)} litres</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Point de départ:</span>
                <span className="font-medium">
                  {route.useCooperativeAsStart !== false ? cooperative.location : route.startLocation || cooperative.location}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Point d'arrivée:</span>
                <span className="font-medium">
                  {route.useCooperativeAsEnd !== false ? cooperative.location : route.endLocation || cooperative.location}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-base font-medium text-gray-700 mb-3">Distances entre les points</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {route.stops.map((stop, index) => {
                const producer = producers.find(p => p.id === stop.producerId);
                const nextStop = index < route.stops.length - 1 ? route.stops[index + 1] : null;
                const nextProducer = nextStop ? producers.find(p => p.id === nextStop.producerId) : null;
                
                if (!producer) return null;
                
                let distance = 0;
                if (nextProducer) {
                  distance = RouteCalculator.calculateDistance(producer.coordinates, nextProducer.coordinates);
                } else if (route.useCooperativeAsEnd !== false && cooperative) {
                  distance = RouteCalculator.calculateDistance(producer.coordinates, cooperative.coordinates);
                }
                
                return (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {getProducerName(stop.producerId)} → 
                      {nextProducer 
                        ? getProducerName(nextStop!.producerId)
                        : route.useCooperativeAsEnd !== false ? cooperative.name : 'Fin'}
                    </span>
                    <span className="font-medium">{Math.round(distance)} km</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Notes et imprévus */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-medium text-gray-900">Notes et imprévus</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-base font-medium text-gray-700 mb-2">Commentaires généraux</h4>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
              {route.notes || 'Aucune note enregistrée pour cette tournée.'}
            </p>
          </div>
          
          <div>
            <h4 className="text-base font-medium text-gray-700 mb-2">Incidents rencontrés</h4>
            {route.stops.some(stop => stop.status === 'cancelled') ? (
              <div className="space-y-2">
                {route.stops
                  .filter(stop => stop.status === 'cancelled')
                  .map((stop, index) => (
                    <div key={index} className="bg-red-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-red-800">
                        Arrêt annulé: {getProducerName(stop.producerId)}
                      </p>
                      <p className="text-sm text-red-600">
                        Raison: {stop.notes || 'Non spécifiée'}
                      </p>
                    </div>
                  ))
                }
              </div>
            ) : (
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                Aucun incident signalé.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 5. Validation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-medium text-gray-900">Validation</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-base font-medium text-gray-700 mb-2">Responsable de la collecte</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-600">
                {route.driver}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Tournée complétée le {route.completedAt ? format(route.completedAt, 'dd MMMM yyyy', { locale: fr }) : 'N/A'}
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="text-base font-medium text-gray-700 mb-2">Archivage</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-600">
                Rapport généré le {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ID de référence: {route.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}