import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DashboardData, fetchDashboardData, fetchPriceData } from '../../services/dashboardService';
import DashboardKPI from './DashboardKPI';
import DashboardChart from './DashboardChart';
import DashboardProgress from './DashboardProgress';
import DashboardAlerts from './DashboardAlerts';
import DashboardTargets from './DashboardTargets';
import ProducerDistributionMap from './ProducerDistributionMap';
// Weather widget import removed
import StockEvolutionChart from './StockEvolutionChart';

const Dashboard: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    production: { current: 0, target: 0, trend: 0 },
    storage: { used: 0, total: 0, trend: 0 },
    producers: { active: 0, total: 0, trend: 0 },
    profit: { current: 0, target: 0, trend: 0 }
  });
  const [priceData, setPriceData] = useState<any>(null);
  const [storageData, setStorageData] = useState<any>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch main dashboard data
        const dashboardData = await fetchDashboardData(timeFilter);
        setData(dashboardData);

        // Fetch price chart data
        const prices = await fetchPriceData(timeFilter);
        setPriceData(prices);

        // Fetch storage distribution data
        const warehousesQuery = query(collection(db, 'warehouses'));
        const warehousesSnapshot = await getDocs(warehousesQuery);
        const warehousesData = warehousesSnapshot.docs.map(doc => ({
          name: doc.data().name,
          value: doc.data().currentStock || 0
        }));

        setStorageData({
          labels: warehousesData.map(w => w.name),
          datasets: [{
            data: warehousesData.map(w => w.value),
            backgroundColor: [
              '#FF6B00', // Orange
              '#4CAF50', // Green
              '#2196F3', // Blue
              '#9C27B0', // Purple
              '#FF9800'  // Light Orange
            ]
          }]
        });

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [timeFilter]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weather Widget removed */}

      {/* Time filter */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {(['day', 'week', 'month', 'year'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                timeFilter === filter
                  ? 'bg-[#2F5E1E] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {filter === 'day' ? 'Jour' :
               filter === 'week' ? 'Semaine' :
               filter === 'month' ? 'Mois' : 'Année'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardKPI
          title="Collecte"
          value={data.production.current}
          target={data.production.target}
          unit="tonnes"
          trend={data.production.trend}
          type="collection"
        />
        <DashboardKPI
          title="Capacité de stockage"
          value={data.storage.used}
          target={data.storage.total}
          unit="tonnes"
          trend={data.storage.trend}
          type="storage"
        />
        <DashboardKPI
          title="Producteurs"
          value={data.producers.active}
          target={data.producers.total}
          unit=""
          trend={data.producers.trend}
          type="producers"
        />
      </div>

      {/* Stock Evolution Chart */}
      <StockEvolutionChart />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {priceData && (
          <DashboardChart
            type="line"
            data={priceData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom' as const
                }
              }
            }}
            title="Évolution des prix"
          />
        )}
        {storageData && (
          <DashboardChart
            type="pie"
            data={storageData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom' as const
                }
              }
            }}
            title="Répartition des stocks"
          />
        )}
      </div>

      {/* Producer Distribution Map */}
      <ProducerDistributionMap />

      {/* Progress and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardAlerts />
        <DashboardProgress
          title="Progression"
          steps={[
            { label: 'Collecte', progress: (data.production.current / data.production.target) * 100 },
            { label: 'Producteurs', progress: (data.producers.active / data.producers.total) * 100 },
            { label: 'Bénéfices', progress: (data.profit.current / data.profit.target) * 100 }
          ]}
        />
      </div>

      {/* Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardTargets />
      </div>
    </div>
  );
};

export default Dashboard;