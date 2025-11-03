import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AlertTriangle, Bell, TrendingDown, Package } from 'lucide-react';

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'error';
  message: string;
  icon: React.ReactNode;
}

export default function DashboardAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateAlerts = async () => {
      try {
        setIsLoading(true);
        const generatedAlerts: Alert[] = [];

        // Check low stock levels
        const warehousesQuery = query(collection(db, 'warehouses'));
        const warehousesSnapshot = await getDocs(warehousesQuery);
        const warehouses = warehousesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        for (const warehouse of warehouses) {
          const capacity = warehouse.capacity || 0;
          const currentStock = warehouse.currentStock || 0;
          const occupancyRate = (currentStock / capacity) * 100;

          if (occupancyRate >= 90) {
            generatedAlerts.push({
              id: `stock-${warehouse.id}`,
              type: 'warning',
              message: `Le magasin ${warehouse.name} est presque plein (${occupancyRate.toFixed(1)}%)`,
              icon: <Package className="w-5 h-5" />
            });
          }
        }

        // Check overdue deliveries
        const today = new Date();
        const deliveriesQuery = query(
          collection(db, 'deliveryOrders'),
          where('status', '==', 'pending')
        );
        const deliveriesSnapshot = await getDocs(deliveriesQuery);
        const overdueDeliveries = deliveriesSnapshot.docs.filter(doc => {
          const deliveryDate = doc.data().deliveryDate?.toDate();
          return deliveryDate && deliveryDate < today;
        });

        if (overdueDeliveries.length > 0) {
          generatedAlerts.push({
            id: 'overdue-deliveries',
            type: 'error',
            message: `${overdueDeliveries.length} livraison(s) en retard`,
            icon: <TrendingDown className="w-5 h-5" />
          });
        }

        setAlerts(generatedAlerts);
      } catch (error) {
        console.error('Error generating alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateAlerts();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-medium text-gray-900">Alertes</h3>
        </div>
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-medium text-gray-900">Alertes</h3>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucune alerte
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-3 p-4 rounded-lg ${
                alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                alert.type === 'error' ? 'bg-red-50 text-red-700' :
                'bg-blue-50 text-blue-700'
              }`}
            >
              {alert.icon}
              <p className="text-sm">{alert.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}