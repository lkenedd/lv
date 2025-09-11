import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ServiceTypeChartProps {
  data: Array<{
    servico: string;
    quantidade: number;
    receita: number;
  }>;
}

const ServiceTypeChart: React.FC<ServiceTypeChartProps> = ({ data }) => {
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Green
    'rgba(245, 158, 11, 0.8)',   // Yellow
    'rgba(239, 68, 68, 0.8)',    // Red
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(20, 184, 166, 0.8)',   // Teal
    'rgba(251, 146, 60, 0.8)',   // Orange
  ];

  const borderColors = [
    'rgba(59, 130, 246, 1)',
    'rgba(16, 185, 129, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(239, 68, 68, 1)',
    'rgba(139, 92, 246, 1)',
    'rgba(236, 72, 153, 1)',
    'rgba(20, 184, 166, 1)',
    'rgba(251, 146, 60, 1)',
  ];

  const chartData = {
    labels: data.map(item => item.servico),
    datasets: [
      {
        data: data.map(item => item.quantidade),
        backgroundColor: colors.slice(0, data.length),
        borderColor: borderColors.slice(0, data.length),
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(75, 85, 99, 0.4)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            
            return `${label}: ${value} serviços (${percentage}%)`;
          },
          afterLabel: function(context: any) {
            const serviceData = data[context.dataIndex];
            if (serviceData && serviceData.receita) {
              return `Receita: ${new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(parseFloat(serviceData.receita.toString()))}`;
            }
            return '';
          }
        }
      }
    },
    cutout: '60%',
    elements: {
      arc: {
        borderRadius: 8,
      }
    }
  };

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold text-white mb-6">Serviços por Tipo</h3>
      <div className="h-80">
        <Doughnut data={chartData} options={options} />
      </div>
      {/* Summary Stats */}
      <div className="mt-6 space-y-2">
        {data.slice(0, 3).map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: colors[index] }}
              ></div>
              <span className="text-gray-300">{item.servico}</span>
            </div>
            <div className="text-white font-medium">
              {item.quantidade} ({((item.quantidade / data.reduce((acc, curr) => acc + curr.quantidade, 0)) * 100).toFixed(1)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceTypeChart;