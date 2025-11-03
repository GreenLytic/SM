import React from 'react';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartProps {
  type: 'line' | 'pie';
  data: any;
  options: any;
  title: string;
}

const chartColors = [
  '#FF6B00', // Orange
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#9C27B0', // Purple
  '#FF9800'  // Light Orange
];

const DashboardChart: React.FC<ChartProps> = ({ type, data, options, title }) => {
  // Modify data to use our custom colors
  const modifiedData = {
    ...data,
    datasets: data.datasets.map((dataset: any, index: number) => ({
      ...dataset,
      borderColor: type === 'line' ? chartColors[0] : undefined,
      backgroundColor: type === 'pie' ? chartColors : chartColors[0],
      borderWidth: type === 'line' ? 2 : 1,
      tension: type === 'line' ? 0.4 : undefined,
      pointBackgroundColor: type === 'line' ? chartColors[0] : undefined,
      pointBorderColor: type === 'line' ? chartColors[0] : undefined,
      pointHoverBackgroundColor: type === 'line' ? chartColors[0] : undefined,
      pointHoverBorderColor: type === 'line' ? chartColors[0] : undefined,
    }))
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-card">
      <h3 className="text-gray-600 text-sm font-medium mb-4">{title}</h3>
      <div className="h-64">
        {type === 'line' ? (
          <Line data={modifiedData} options={options} />
        ) : (
          <Pie data={modifiedData} options={options} />
        )}
      </div>
    </div>
  );
};

export default DashboardChart;