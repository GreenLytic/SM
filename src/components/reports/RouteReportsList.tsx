import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../lib/firebase';
import { CollectionRoute } from '../../types/route';
import { Producer } from '../../types/producer';
import { CooperativeInfo } from '../../types/cooperative';
import { FileText, TrendingUp, Package, FileDown } from 'lucide-react';
import { pdf, PDFDownloadLink } from '@react-pdf/renderer';
import RouteReportPDF from './RouteReportPDF';
import Modal from '../Modal';
import RouteCompletedReport from './RouteCompletedReport';
import { RouteCalculator } from '../../services/routing/RouteCalculator';

interface RouteStats {
  totalRoutes: number;
  totalCollections: number;
  totalWeight: number;
}

export default function RouteReportsList() {
  const [routes, setRoutes] = useState<CollectionRoute[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [cooperative, setCooperative] = useState<CooperativeInfo | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<RouteStats>({
    totalRoutes: 0,
    totalCollections: 0,
    totalWeight: 0
  });
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const startDate = new Date(); 
        
        if (selectedPeriod === 'month') {
          startDate.setMonth(startDate.getMonth() - 1);
        } else if (selectedPeriod === 'quarter') {
          startDate.setMonth(startDate.getMonth() - 3);
        } else if (selectedPeriod === 'year') {
          startDate.setFullYear(startDate.getFullYear() - 1);
        }

        const coopDoc = await getDoc(doc(db, 'cooperativeInfo', 'settings'));
        // Définir des valeurs par défaut même si les données n'existent pas
        const defaultCooperative = {
          name: 'SMARTCOOP',
          location: 'Abidjan',
          coordinates: [5.9309666, -4.2143906]
        };
        
        setCooperative(coopDoc.exists() ? coopDoc.data() as CooperativeInfo : defaultCooperative);

        // Fetch producers
        const producersQuery = query(collection(db, 'producers'));
        const producersSnapshot = await getDocs(producersQuery);
        const producersData = producersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          joinDate: doc.data().joinDate?.toDate()
        })) as Producer[];
        setProducers(producersData);

        // Fetch completed routes - using only status filter to avoid composite index requirement
        const routesQuery = query(
          collection(db, 'routes'),
          where('status', '==', 'completed')
        );

        const routesSnapshot = await getDocs(routesQuery);
        const routeData = routesSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate(),
            completedAt: doc.data().completedAt?.toDate()
          })) as CollectionRoute[];

        // Filter routes by date and sort in memory
        const filteredRoutes = routeData
          .filter(route => route.completedAt && route.completedAt >= startDate)
          .sort((a, b) => {
            if (!a.completedAt || !b.completedAt) return 0;
            return b.completedAt.getTime() - a.completedAt.getTime();
          });

        setRoutes(filteredRoutes);

        // Calculate stats
        const calculatedStats = {
          totalRoutes: filteredRoutes.length,
          totalCollections: filteredRoutes.reduce((sum, route) => 
            sum + route.stops.filter(stop => stop.status === 'completed').length, 0),
          totalWeight: filteredRoutes.reduce((sum, route) => 
            sum + route.stops
              .filter(stop => stop.status === 'completed')
              .reduce((stopSum, stop) => stopSum + (stop.estimatedQuantity || 0), 0), 0)
        };

        setStats(calculatedStats);
      } catch (error) {
        console.error('Error fetching route data:', error);
        toast.error('Erreur lors du chargement des rapports');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

  const handleViewReport = (routeId: string) => {
    setSelectedRouteId(routeId);
    setIsReportModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total tournées</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalRoutes}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="text-green-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Collectes réalisées</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalCollections}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="text-purple-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Volume total</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.totalWeight.toFixed(2)} tonnes
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Rapports de tournées</h2>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="month">Dernier mois</option>
              <option value="quarter">Dernier trimestre</option>
              <option value="year">Dernière année</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-2 text-gray-500">Chargement des données...</p>
            </div>
          ) : routes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune tournée terminée pour la période sélectionnée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chauffeur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collectes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volume</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {routes.map((route) => {
                    const completedStops = route.stops.filter(stop => stop.status === 'completed');
                    const totalWeight = completedStops.reduce((sum, stop) => sum + (stop.estimatedQuantity || 0), 0);
                    const distance = cooperative && producers.length > 0 ? 
                      RouteCalculator.calculateRouteDistance(route, producers, cooperative) : 0;
                    
                    return (
                      <tr key={route.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {format(route.completedAt!, 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {route.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {route.driver}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {completedStops.length}/{route.stops.length}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {totalWeight.toFixed(2)} tonnes
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {Math.round(distance)} km
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewReport(route.id!)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Voir</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)}
        size="xl"
      >
        {selectedRouteId && (
          <RouteCompletedReport 
            routeId={selectedRouteId} 
            onClose={() => setIsReportModalOpen(false)} 
          />
        )}
      </Modal>
    </div>
  );
}