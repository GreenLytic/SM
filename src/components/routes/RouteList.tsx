import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CollectionRoute } from '../../types/route';
import { Producer } from '../../types/producer';
import { Search, Plus, ArrowUpDown, ArrowUp, ArrowDown, FileText, Map, FileSpreadsheet, Download, Loader, FileDown } from 'lucide-react';
import Modal from '../Modal';
import RouteForm from './RouteForm';
import RouteActions from './RouteActions';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { RouteCalculator } from '../../services/routing/RouteCalculator';
import { pdf } from '@react-pdf/renderer';
import RouteCollectionSheet from './RouteCollectionSheet';
import RouteDetailsSheet from './RouteDetailsSheet';
import RoutePlanningPDF from './RoutePlanningPDF';

type SortField = 'date' | 'name' | 'driver';
type SortOrder = 'asc' | 'desc';

export default function RouteList() {
  const [routes, setRoutes] = useState<CollectionRoute[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<CollectionRoute | null>(null);
  const [cooperative, setCooperative] = useState<any>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc'); 
  const [activeTab, setActiveTab] = useState<'statut' | 'documents' | 'actions'>('statut');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    // Fetch cooperative info
    const fetchCooperative = async () => {
      const docRef = doc(db, 'cooperativeInfo', 'settings');
      const docSnap = await getDoc(docRef);
      // Définir des valeurs par défaut même si les données n'existent pas
      const defaultCooperative = {
        name: 'SMARTCOOP',
        location: 'Abidjan',
        coordinates: [5.9309666, -4.2143906]
      };
      
      setCooperative(docSnap.exists() ? docSnap.data() : defaultCooperative);
    };
    fetchCooperative();

    // Fetch routes
    const routesQuery = query(collection(db, 'routes'), orderBy(sortField, sortOrder));
    const unsubscribeRoutes = onSnapshot(routesQuery, (snapshot) => {
      const routeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        completedAt: doc.data().completedAt?.toDate()
      })) as CollectionRoute[];
      setRoutes(routeData);
    });

    // Fetch producers
    const producersQuery = query(collection(db, 'producers'));
    const unsubscribeProducers = onSnapshot(producersQuery, (snapshot) => {
      const producerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinDate: doc.data().joinDate?.toDate()
      })) as Producer[];
      setProducers(producerData);
    });

    return () => {
      unsubscribeRoutes();
      unsubscribeProducers();
    };
  }, [sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return 'Planifiée';
      case 'in-progress': return 'En cours';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getProducerNames = (route: CollectionRoute) => {
    return route.stops
      .map(stop => {
        const producer = producers.find(p => p.id === stop.producerId);
        return producer?.fullName;
      })
      .filter(Boolean)
      .join(', ');
  };

  const getRouteDistance = (route: CollectionRoute): string => {
    if (!cooperative || !producers.length) return "N/A";
    
    const routeProducers = producers.filter(p => 
      route.stops.some(stop => stop.producerId === p.id)
    );
    
    const distance = RouteCalculator.calculateRouteDistance(route, routeProducers, cooperative);
    return `${distance} km`;
  };

  const handleGeneratePdf = async (route: CollectionRoute, type: string) => {
    if (!cooperative) {
      toast.error('Informations de la coopérative non disponibles');
      return;
    }
    
    const routeId = route.id || '';
    const key = `${routeId}-${type}`;
    
    try {
      setIsGeneratingPdf(prev => ({ ...prev, [key]: true }));
      
      const routeProducers = producers.filter(p => route.stops.some(stop => stop.producerId === p.id));
      
      if (routeProducers.length === 0) {
        toast.error('Aucun producteur trouvé pour cette tournée');
        return;
      }
      
      const distance = RouteCalculator.calculateRouteDistance(route, producers, cooperative);
      const duration = RouteCalculator.estimateDuration(distance);
      
      // Define today variable for consistent date formatting
      const today = new Date();
      
      let document;
      let filename: string;
      
      switch (type) {
        case 'collection':
          document = (
            <RouteCollectionSheet
              route={route}
              producers={routeProducers}
              cooperative={cooperative}
              distance={distance}
              duration={duration}
            />
          );
          filename = `feuille-collecte-${route.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
          break;
        case 'route':
          document = (
            <RouteDetailsSheet
              route={route}
              producers={routeProducers}
              cooperative={cooperative}
              mapImageUrl={undefined}
            />
          );
          filename = `feuille-route-${route.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
          break;
        case 'planning':
          document = (
            <RoutePlanningPDF
              route={route}
              producers={routeProducers}
              cooperative={cooperative}
              distance={distance}
              duration={duration}
            />
          );
          filename = `plan-tournee-${route.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
          break;
        default:
          throw new Error('Type de document non reconnu');
      }
      
      // Générer le PDF
      const blob = await pdf(document).toBlob();
      
      // Créer une URL pour le blob
      const url = URL.createObjectURL(blob);
      
      // Créer un lien et déclencher le téléchargement
      const link = window.document.createElement('a');
      link.href = url;
      link.download = filename;
      window.document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('PDF généré avec succès');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPdf(prev => ({ ...prev, [key]: false }));
    }
  };

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getProducerNames(route).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Tournées de ramassage</h2>
        <button
          onClick={() => {
            setSelectedRoute(null);
            setIsRouteModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle tournée</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom, chauffeur ou producteur..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('statut')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'statut' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            STATUT
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'documents' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            DOCUMENTS
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'actions' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ACTIONS
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Date
                    {getSortIcon('date')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Nom
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button 
                    onClick={() => handleSort('driver')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Chauffeur
                    {getSortIcon('driver')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Départ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrêts</th>
                {activeTab === 'statut' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                )}
                {activeTab === 'documents' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
                )}
                {activeTab === 'actions' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Aucune tournée trouvée
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {format(route.date, 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {route.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {route.driver}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {route.startTime}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getRouteDistance(route)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {route.stops.length} arrêts
                    </td>
                    {activeTab === 'statut' && (
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(route.status)}`}>
                          {getStatusText(route.status)}
                        </span>
                      </td>
                    )}
                    {activeTab === 'documents' && (
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => handleGeneratePdf(route, 'collection')} 
                            disabled={isGeneratingPdf[`${route.id}-collection`]} 
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded-md hover:bg-blue-50 disabled:opacity-50 w-full"
                          >
                            {isGeneratingPdf[`${route.id}-collection`] ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileDown className="w-4 h-4" />
                            )}
                            <span className="text-sm ml-1">Feuille de collecte</span>
                          </button>
                          
                          <button 
                            onClick={() => handleGeneratePdf(route, 'route')}
                            disabled={isGeneratingPdf[`${route.id}-route`]}
                            className="flex items-center gap-1 text-amber-600 hover:text-amber-800 px-2 py-1 border border-amber-200 rounded-md hover:bg-amber-50 disabled:opacity-50 w-full"
                          >
                            {isGeneratingPdf[`${route.id}-route`] ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileDown className="w-4 h-4" />
                            )}
                            <span className="text-sm ml-1">Feuille de route</span>
                          </button>
                          
                          <button 
                            onClick={() => handleGeneratePdf(route, 'planning')}
                            disabled={isGeneratingPdf[`${route.id}-planning`]}
                            className="flex items-center gap-1 text-green-600 hover:text-green-800 px-2 py-1 border border-green-200 rounded-md hover:bg-green-50 disabled:opacity-50 w-full"
                          >
                            {isGeneratingPdf[`${route.id}-planning`] ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileDown className="w-4 h-4" />
                            )}
                            <span className="text-sm ml-1">Plan de tournée</span>
                          </button>
                        </div>
                      </td>
                    )}
                    {activeTab === 'actions' && (
                      <td className="px-6 py-4">
                        <RouteActions
                          route={route}
                          producers={producers}
                          onEdit={() => {
                            setSelectedRoute(route);
                            setIsRouteModalOpen(true);
                          }}
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isRouteModalOpen} onClose={() => {
        setIsRouteModalOpen(false);
        setSelectedRoute(null);
      }}>
        <RouteForm
          onClose={() => {
            setIsRouteModalOpen(false);
            setSelectedRoute(null);
          }}
          route={selectedRoute}
          producers={producers}
        />
      </Modal>
    </div>
  );
}