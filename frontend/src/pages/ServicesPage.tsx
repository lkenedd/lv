import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/auth';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface Service {
  id: number;
  carro: string;
  placa: string;
  nome_cliente: string;
  telefone: string;
  servico: string;
  valor: number;
  status: string;
  data: string;
  funcionario_nome?: string;
}

const ServicesPage: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newService, setNewService] = useState({
    carro: '',
    placa: '',
    nome_cliente: '',
    telefone: '',
    servico: '',
    valor: '',
    status: 'em_andamento',
  });

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await api.get(`/servicos?${params.toString()}`);
      setServices(response.data.services || []);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [search, statusFilter]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/servicos', {
        ...newService,
        valor: parseFloat(newService.valor),
      });
      
      toast.success('Serviço adicionado com sucesso!');
      setServices([response.data, ...services]);
      setShowAddModal(false);
      setNewService({
        carro: '',
        placa: '',
        nome_cliente: '',
        telefone: '',
        servico: '',
        valor: '',
        status: 'em_andamento',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao adicionar serviço');
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este serviço?')) {
      return;
    }

    try {
      await api.delete(`/servicos/${serviceId}`);
      
      if (isAdmin(user)) {
        toast.success('Serviço excluído com sucesso!');
        setServices(services.filter(s => s.id !== serviceId));
      } else {
        toast.success('Solicitação de exclusão enviada para aprovação!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao processar exclusão');
    }
  };

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

  return (
    <DashboardLayout title="Gerenciamento de Serviços">
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isAdmin(user) ? 'Todos os Serviços' : 'Meus Serviços'}
            </h2>
            <p className="text-gray-400 mt-1">
              {isAdmin(user) 
                ? 'Gerencie todos os serviços do lava-jato'
                : 'Visualize e gerencie seus serviços'
              }
            </p>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Novo Serviço</span>
          </button>
        </div>

        {/* Filters */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Buscar
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cliente, placa ou veículo..."
                  className="input-field pl-10 w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                className="input-field w-full"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchServices}
                className="btn-secondary w-full"
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Nenhum serviço encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-800 bg-opacity-50">
                  <tr>
                    <th className="text-left py-3 px-6 text-gray-300 font-medium">Cliente</th>
                    <th className="text-left py-3 px-6 text-gray-300 font-medium">Veículo</th>
                    <th className="text-left py-3 px-6 text-gray-300 font-medium">Serviço</th>
                    <th className="text-left py-3 px-6 text-gray-300 font-medium">Valor</th>
                    <th className="text-left py-3 px-6 text-gray-300 font-medium">Status</th>
                    <th className="text-left py-3 px-6 text-gray-300 font-medium">Data</th>
                    {isAdmin(user) && (
                      <th className="text-left py-3 px-6 text-gray-300 font-medium">Funcionário</th>
                    )}
                    <th className="text-left py-3 px-6 text-gray-300 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-b border-gray-700 hover:bg-gray-800 hover:bg-opacity-30">
                      <td className="py-4 px-6">
                        <div className="text-white font-medium">{service.nome_cliente}</div>
                        <div className="text-gray-400 text-sm">{service.telefone}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-300">{service.carro}</div>
                        <div className="text-gray-400 text-sm">{service.placa}</div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">{service.servico}</td>
                      <td className="py-4 px-6 text-white font-medium">
                        {formatCurrency(service.valor)}
                      </td>
                      <td className="py-4 px-6">
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
                      <td className="py-4 px-6 text-gray-300 text-sm">
                        {formatDate(service.data)}
                      </td>
                      {isAdmin(user) && (
                        <td className="py-4 px-6 text-gray-300 text-sm">
                          {service.funcionario_nome}
                        </td>
                      )}
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <button
                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                            title="Excluir"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Service Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4">Novo Serviço</h3>
              
              <form onSubmit={handleAddService} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cliente
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field w-full"
                    value={newService.nome_cliente}
                    onChange={(e) => setNewService({...newService, nome_cliente: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    required
                    className="input-field w-full"
                    value={newService.telefone}
                    onChange={(e) => setNewService({...newService, telefone: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Veículo
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field w-full"
                    value={newService.carro}
                    onChange={(e) => setNewService({...newService, carro: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Placa
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field w-full"
                    value={newService.placa}
                    onChange={(e) => setNewService({...newService, placa: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de Serviço
                  </label>
                  <select
                    required
                    className="input-field w-full"
                    value={newService.servico}
                    onChange={(e) => setNewService({...newService, servico: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    <option value="Lavagem Simples">Lavagem Simples</option>
                    <option value="Lavagem Completa">Lavagem Completa</option>
                    <option value="Lavagem + Cera">Lavagem + Cera</option>
                    <option value="Enceramento">Enceramento</option>
                    <option value="Lavagem do Motor">Lavagem do Motor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="input-field w-full"
                    value={newService.valor}
                    onChange={(e) => setNewService({...newService, valor: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    className="input-field w-full"
                    value={newService.status}
                    onChange={(e) => setNewService({...newService, status: e.target.value})}
                  >
                    <option value="em_andamento">Em Andamento</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ServicesPage;