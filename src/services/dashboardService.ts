import { collection, query, where, getDocs, Timestamp, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface DashboardData {
  revenue: {
    current: number;
    target: number;
    trend: number;
  };
  production: {
    current: number;
    target: number;
    trend: number;
  };
  storage: {
    used: number;
    total: number;
    trend: number;
  };
  producers: {
    active: number;
    total: number;
    trend: number;
  };
  profit: {
    current: number;
    target: number;
    trend: number;
  };
}

export const fetchDashboardData = async (timeFilter: string): Promise<DashboardData> => {
  try {
    // Get current targets
    const targetDoc = await getDoc(doc(db, 'targets', 'current'));
    const targets = targetDoc.exists() ? targetDoc.data() : { producers: 100, production: 1000 };

    // Get current budget
    const budgetsQuery = query(collection(db, 'budgets'), where('status', '==', 'active'));
    const budgetsSnapshot = await getDocs(budgetsQuery);
    const activeBudget = budgetsSnapshot.docs[0]?.data();
    const revenueTarget = activeBudget?.targetRevenue || 1000000;
    const profitTarget = activeBudget?.targetProfit || 500000;

    // Calculate net assets (revenue) and profits
    const stocksQuery = query(collection(db, 'stocks'));
    const stocksSnapshot = await getDocs(stocksQuery);
    const stockValue = stocksSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.totalCost || 0);
    }, 0);

    const workingCapital = activeBudget?.investments.reduce(
      (sum: number, inv: any) => sum + (inv.amount || 0), 
      0
    ) || 0;

    const deliveriesQuery = query(
      collection(db, 'deliveryOrders'),
      where('status', '==', 'completed')
    );
    const deliveriesSnapshot = await getDocs(deliveriesQuery);
    
    let totalSales = 0;
    let profits = 0;
    let losses = 0;

    deliveriesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const costs = data.costs || {};
      totalSales += costs.sellingPrice || 0;
      
      const profit = costs.profit || 0;
      if (profit >= 0) {
        profits += profit;
      } else {
        losses += Math.abs(profit);
      }
    });

    const netAssets = workingCapital - stockValue + totalSales + profits - losses;
    const netProfit = profits - losses;

    // Get collections data
    const collectionsQuery = query(collection(db, 'collections'));
    const collectionsSnapshot = await getDocs(collectionsQuery);
    const totalCollections = collectionsSnapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().quantity || 0);
    }, 0);

    // Get storage data
    const warehousesQuery = query(collection(db, 'warehouses'));
    const warehousesSnapshot = await getDocs(warehousesQuery);
    const storage = warehousesSnapshot.docs.reduce((acc, doc) => {
      const data = doc.data();
      return {
        used: acc.used + (data.currentStock || 0),
        total: acc.total + (data.capacity || 0)
      };
    }, { used: 0, total: 0 });

    // Get producer data
    const producersQuery = query(collection(db, 'producers'));
    const producersSnapshot = await getDocs(producersQuery);
    const producers = producersSnapshot.docs.reduce((acc, doc) => {
      const data = doc.data();
      return {
        total: acc.total + 1,
        active: acc.active + (data.status === 'active' ? 1 : 0)
      };
    }, { total: 0, active: 0 });

    // Calculate trends with 2 decimal places
    const revenueTrend = Number(((netAssets / revenueTarget) * 100 - 100).toFixed(2));
    const productionTrend = Number(((totalCollections / targets.production) * 100 - 100).toFixed(2));
    const storageTrend = Number(((storage.used / storage.total) * 100 - 80).toFixed(2));
    const producersTrend = Number(((producers.active / targets.producers) * 100 - 100).toFixed(2));
    const profitTrend = Number(((netProfit / profitTarget) * 100 - 100).toFixed(2));

    return {
      revenue: {
        current: netAssets,
        target: revenueTarget,
        trend: revenueTrend
      },
      production: {
        current: totalCollections,
        target: targets.production,
        trend: productionTrend
      },
      storage: {
        used: storage.used,
        total: storage.total,
        trend: storageTrend
      },
      producers: {
        active: producers.active,
        total: targets.producers,
        trend: producersTrend
      },
      profit: {
        current: netProfit,
        target: profitTarget,
        trend: profitTrend
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

export const fetchPriceData = async (timeFilter: string) => {
  try {
    const priceQuery = query(
      collection(db, 'priceSettings'),
      orderBy('effectiveDate', 'desc'),
      limit(6)
    );
    
    const snapshot = await getDocs(priceQuery);
    const priceData = snapshot.docs.map(doc => ({
      date: doc.data().effectiveDate.toDate(),
      price: doc.data().basePrice
    }));

    return {
      labels: priceData.map(d => d.date.toLocaleDateString('fr-FR', { month: 'short' })),
      datasets: [{
        label: 'Prix du marché (FCFA/kg)',
        data: priceData.map(d => d.price),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    };
  } catch (error) {
    console.error('Error fetching price data:', error);
    throw error;
  }
};