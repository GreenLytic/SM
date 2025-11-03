import React from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getKPIColor, getKPIStyles } from '../../utils/dashboardUtils';
import { formatNumber } from '../../utils/formatUtils';

interface KPIProps {
  title: string;
  value: number;
  target: number;
  unit: string;
  trend?: number;
  type: 'revenue' | 'collection' | 'storage' | 'producers';
}

const DashboardKPI: React.FC<KPIProps> = ({ 
  title, 
  value, 
  target, 
  unit, 
  trend, 
  type 
}) => {
  const percentage = Math.min((value / target) * 100, 100);
  const color = getKPIColor(type);
  const styles = getKPIStyles(color);
  
  return (
    <div className="bg-white rounded-lg p-6 shadow-card hover:shadow-lg transition-all duration-200">
      <h3 className="text-gray-600 text-sm font-medium mb-4">{title}</h3>
      <div className="flex items-center justify-between">
        <div className="w-20 h-20">
          <CircularProgressbar
            value={percentage}
            text={`${Math.round(percentage)}%`}
            styles={styles}
          />
        </div>
        <div className="flex-1 ml-4">
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(value)} {unit}
          </div>
          <div className="text-sm text-gray-500">
            Objectif: {formatNumber(target)} {unit}
          </div>
          {trend !== undefined && (
            <div className={`flex items-center mt-2 ${
              trend >= 0 ? 'text-success' : 'text-error'
            }`}>
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              <span className="text-sm font-medium">{Math.abs(trend).toFixed(2)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardKPI;