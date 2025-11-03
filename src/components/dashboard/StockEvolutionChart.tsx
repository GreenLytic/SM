import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Bar } from 'react-chartjs-2';
import { format, subDays, subMonths, subYears, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DailyStock {
  date: string;
  quantity: number;
}

type Period = '7d' | '30d' | '3m' | '6m' | '1y';

export default function StockEvolutionChart() {
  const [stockData, setStockData] = useState<DailyStock[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d');
  const [isLoading, setIsLoading] = useState(true);

  const periods = [
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' },
    { value: '3m', label: '3 mois' },
    { value: '6m', label: '6 mois' },
    { value: '1y', label: '1 an' }
  ];

  const getStartDate = (period: Period): Date => {
    const today = startOfDay(new Date());
    switch (period) {
      case '7d': return subDays(today, 7);
      case '30d': return subDays(today, 30);
      case '3m': return subMonths(today, 3);
      case '6m': return subMonths(today, 6);
      case '1y': return subYears(today, 1);
      default: return subDays(today, 30);
    }
  };

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setIsLoading(true);
        const startDate = getStartDate(selectedPeriod);
        
        const stocksQuery = query(
          collection(db, 'stocks'),
          where('date', '>=', Timestamp.fromDate(startDate)),
          orderBy('date', 'asc')
        );

        const snapshot = await getDocs(stocksQuery);
        
        // Group stocks by date
        const stocksByDate = snapshot.docs.reduce((acc: { [key: string]: number }, doc) => {
          const date = format(doc.data().date.toDate(), 'yyyy-MM-dd');
          const quantity = doc.data().quantity || 0;
          
          acc[date] = (acc[date] || 0) + quantity;
          return acc;
        }, {});

        // Create array for the selected period
        const dailyData: DailyStock[] = [];
        const daysToShow = (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        
        for (let i = 0; i <= daysToShow; i++) {
          const date = format(subDays(new Date(), daysToShow - i), 'yyyy-MM-dd');
          dailyData.push({
            date,
            quantity: stocksByDate[date] || 0
          });
        }

        setStockData(dailyData);
      } catch (error) {
        console.error('Error fetching stock data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
  }, [selectedPeriod]);

  const chartData = {
    labels: stockData.map(d => format(new Date(d.date), 
      selectedPeriod === '7d' ? 'EEEE' :
      selectedPeriod === '30d' ? 'dd MMM' :
      'MMM yyyy', 
      { locale: fr }
    )),
    datasets: [
      {
        label: 'Stock en magasin (tonnes)',
        data: stockData.map(d => d.quantity),
        backgroundColor: '#2F5E1E',
        borderColor: '#1F3D13',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Évolution du stock sur ${
          selectedPeriod === '7d' ? '7 jours' :
          selectedPeriod === '30d' ? '30 jours' :
          selectedPeriod === '3m' ? '3 mois' :
          selectedPeriod === '6m' ? '6 mois' :
          '1 an'
        }`,
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y.toFixed(2)} tonnes`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Tonnes'
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-card h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F5E1E]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-card">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#2F5E1E]" />
          <h3 className="text-lg font-medium text-gray-900">Évolution du stock</h3>
        </div>
        <div className="flex gap-2">
          {periods.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSelectedPeriod(value as Period)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                selectedPeriod === value
                  ? 'bg-[#2F5E1E] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[400px]">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}