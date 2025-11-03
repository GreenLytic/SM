import React from 'react';

interface Step {
  label: string;
  progress: number;
}

interface DashboardProgressProps {
  title: string;
  steps: Step[];
}

const DashboardProgress: React.FC<DashboardProgressProps> = ({ title, steps }) => {
  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return 'bg-success';
    if (progress >= 50) return 'bg-warning';
    return 'bg-error';
  };

  const normalizeProgress = (value: number): number => {
    return Math.min(Math.max(value, 0), 100);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-card">
      <h3 className="text-gray-600 text-sm font-medium mb-4">{title}</h3>
      <div className="space-y-4">
        {steps.map((step, index) => {
          const normalizedProgress = normalizeProgress(step.progress);
          
          return (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{step.label}</span>
                <span className="font-medium text-gray-900">
                  {normalizedProgress.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(normalizedProgress)} transition-all duration-500`}
                  style={{ width: `${normalizedProgress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardProgress;