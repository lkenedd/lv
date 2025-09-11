import React, { useState, useEffect } from 'react';
import { servicosAPI } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Estatisticas {
  periodo: string;
  total_receita: number;
  total_servicos: number;
  servicos_por_tipo: Array<{
    servico: string;
    quantidade: number;
    receita: number;
  }>;
  receita_diaria: Array<{
    dia: string;
    servicos: number;
    receita: number;
  }>;
}

const AdminDashboard: React.FC = () => {
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [periodo, setPeriodo] = useState('mes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await servicosAPI.getEstatisticas(periodo);
        setEstatisticas(response.data);
      } catch (error: any) {
        setError('Erro ao carregar estatísticas');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [periodo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  if (error || !estatisticas) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error || 'Erro ao carregar dados'}
      </div>
    );
  }

  // Prepare chart data
  const dailyRevenueData = {
    labels: estatisticas.receita_diaria.map(item => 
      new Date(item.dia).toLocaleDateString('pt-BR')
    ),
    datasets: [
      {
        label: 'Receita (R$)',
        data: estatisticas.receita_diaria.map(item => item.receita),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const serviceTypeData = {
    labels: estatisticas.servicos_por_tipo.map(item => item.servico),
    datasets: [
      {
        data: estatisticas.servicos_por_tipo.map(item => item.quantidade),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#F97316',
        ],
      },
    ],
  };

  const servicosBarData = {
    labels: estatisticas.servicos_por_tipo.map(item => item.servico),
    datasets: [
      {
        label: 'Quantidade',
        data: estatisticas.servicos_por_tipo.map(item => item.quantidade),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard Admin</h1>
        
        <div className="flex items-center space-x-4">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="dia">Hoje</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Receita Total</p>
              <p className="text-2xl font-semibold">
                R$ {estatisticas.total_receita.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Total de Serviços</p>
              <p className="text-2xl font-semibold">{estatisticas.total_servicos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Ticket Médio</p>
              <p className="text-2xl font-semibold">
                R$ {estatisticas.total_servicos > 0 
                  ? (estatisticas.total_receita / estatisticas.total_servicos).toFixed(2).replace('.', ',')
                  : '0,00'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Receita nos Últimos 7 Dias</h3>
          <div className="h-64">
            <Line
              data={dailyRevenueData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: {
                      color: 'white',
                    },
                  },
                },
                scales: {
                  x: {
                    ticks: {
                      color: 'white',
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                  y: {
                    ticks: {
                      color: 'white',
                      callback: function(value: any) {
                        return 'R$ ' + value.toFixed(2);
                      },
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Service Types Doughnut */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Serviços por Tipo</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={serviceTypeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: 'white',
                      padding: 20,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Services Bar Chart */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quantidade de Serviços por Tipo</h3>
        <div className="h-64">
          <Bar
            data={servicosBarData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: {
                    color: 'white',
                  },
                },
              },
              scales: {
                x: {
                  ticks: {
                    color: 'white',
                  },
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                  },
                },
                y: {
                  ticks: {
                    color: 'white',
                  },
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;