import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueChartProps {
  data: Array<{
    data: string;
    total_servicos: number;
    receita: number;
  }>;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map(item => {
      const date = new Date(item.data);
      return date.toLocaleDateString('pt-BR', { 
        month: 'short', 
        day: 'numeric' 
      });
    }),
    datasets: [
      {
        label: 'Receita (R$)',
        data: data.map(item => parseFloat(item.receita.toString()) || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Serviços',
        data: data.map(item => item.total_servicos),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        yAxisID: 'y1',
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          usePointStyle: true,
          pointStyle: 'circle',
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
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.datasetIndex === 0) {
              label += new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(context.parsed.y);
            } else {
              label += context.parsed.y + ' serviços';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: '#9CA3AF',
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: '#9CA3AF',
          callback: function(value: any) {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
            }).format(value);
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#9CA3AF',
        }
      },
    },
  };

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold text-white mb-6">Receita dos Últimos 7 Dias</h3>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default RevenueChart;