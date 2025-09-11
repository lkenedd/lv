import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    yellow: 'from-yellow-600 to-yellow-700',
    red: 'from-red-600 to-red-700',
    purple: 'from-purple-600 to-purple-700',
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {change && (
            <p className="text-green-400 text-sm mt-2">
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;