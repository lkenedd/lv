import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import StatsCard from '../components/Charts/StatsCard';
import RevenueChart from '../components/Charts/RevenueChart';
import ServiceTypeChart from '../components/Charts/ServiceTypeChart';
import api from '../utils/api';
import { toast } from 'react-toastify';
import {
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  stats: {
    total_servicos: number;
    servicos_finalizados: number;
    servicos_andamento: number;
    receita_total: number;
  };
  charts: {
    servicesChart: Array<{
      data: string;
      total_servicos: number;
      receita: number;
    }>;
    serviceTypes: Array<{
      servico: string;
      quantidade: number;
      receita: number;
    }>;
  };
  recentServices: Array<{
    id: number;
    carro: string;
    placa: string;
    nome_cliente: string;
    servico: string;
    valor: number;
    status: string;
    data: string;
    funcionario_nome?: string;
  }>;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'total'>('day');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/dashboard/stats?period=${period}`);
        setStats(response.data);
      } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        toast.error('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [period]);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return 'Hoje';
      case 'week': return 'Últimos 7 dias';
      case 'month': return 'Últimos 30 dias';
      case 'total': return 'Total';
      default: return 'Hoje';
    }
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Period Filter */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Visão Geral</h2>
            <p className="text-gray-400 mt-1">Acompanhe o desempenho do seu lava-jato</p>
          </div>
          <div className="flex space-x-2">
            {[
              { key: 'day', label: 'Hoje' },
              { key: 'week', label: '7 dias' },
              { key: 'month', label: '30 dias' },
              { key: 'total', label: 'Total' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setPeriod(item.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  period === item.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Receita Total"
                value={formatCurrency(stats.stats.receita_total)}
                icon={<CurrencyDollarIcon className="h-6 w-6 text-white" />}
                color="green"
              />
              <StatsCard
                title="Total de Serviços"
                value={stats.stats.total_servicos}
                icon={<WrenchScrewdriverIcon className="h-6 w-6 text-white" />}
                color="blue"
              />
              <StatsCard
                title="Serviços Finalizados"
                value={stats.stats.servicos_finalizados}
                icon={<CheckCircleIcon className="h-6 w-6 text-white" />}
                color="green"
              />
              <StatsCard
                title="Em Andamento"
                value={stats.stats.servicos_andamento}
                icon={<ClockIcon className="h-6 w-6 text-white" />}
                color="yellow"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart data={stats.charts.servicesChart} />
              <ServiceTypeChart data={stats.charts.serviceTypes} />
            </div>

            {/* Recent Services */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Serviços Recentes - {getPeriodLabel()}</h3>
                <span className="text-sm text-gray-400">
                  {stats.recentServices.length} serviços
                </span>
              </div>

              {stats.recentServices.length === 0 ? (
                <div className="text-center py-12">
                  <WrenchScrewdriverIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhum serviço encontrado para o período selecionado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Cliente</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Veículo</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Serviço</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Valor</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Data</th>
                        {stats.recentServices.some(s => s.funcionario_nome) && (
                          <th className="text-left py-3 px-4 text-gray-300 font-medium">Funcionário</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentServices.map((service) => (
                        <tr key={service.id} className="border-b border-gray-700 hover:bg-gray-800 hover:bg-opacity-30 transition-colors">
                          <td className="py-3 px-4 text-white">{service.nome_cliente}</td>
                          <td className="py-3 px-4 text-gray-300">
                            {service.carro}
                            <br />
                            <span className="text-xs text-gray-400">{service.placa}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{service.servico}</td>
                          <td className="py-3 px-4 text-white font-medium">
                            {formatCurrency(service.valor)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                service.status === 'finalizado'
                                  ? 'bg-green-900 bg-opacity-50 text-green-400 border border-green-700'
                                  : 'bg-yellow-900 bg-opacity-50 text-yellow-400 border border-yellow-700'
                              }`}
                            >
                              {service.status === 'finalizado' ? 'Finalizado' : 'Em Andamento'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-300 text-sm">
                            {formatDate(service.data)}
                          </td>
                          {service.funcionario_nome && (
                            <td className="py-3 px-4 text-gray-300 text-sm">
                              {service.funcionario_nome}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;