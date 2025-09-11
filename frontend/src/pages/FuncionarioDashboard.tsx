import React, { useState, useEffect } from 'react';
import { servicosAPI } from '../services/api';

interface Servico {
  id: number;
  carro: string;
  placa: string;
  nome_cliente: string;
  telefone?: string;
  servico: string;
  valor: number;
  status: string;
  data: string;
  funcionario_nome?: string;
}

const FuncionarioDashboard: React.FC = () => {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Servico | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    carro: '',
    placa: '',
    nome_cliente: '',
    telefone: '',
    servico: '',
    valor: '',
    status: 'concluido'
  });

  useEffect(() => {
    fetchServicos();
  }, []);

  const fetchServicos = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await servicosAPI.getServicos({
        data_inicio: today,
        data_fim: today,
        page: 1,
        limit: 50
      });
      setServicos(response.data.servicos || []);
    } catch (error: any) {
      setError('Erro ao carregar serviços');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingService) {
        await servicosAPI.updateServico(editingService.id, formData);
      } else {
        await servicosAPI.createServico(formData);
      }
      
      setShowForm(false);
      setEditingService(null);
      setFormData({
        carro: '',
        placa: '',
        nome_cliente: '',
        telefone: '',
        servico: '',
        valor: '',
        status: 'concluido'
      });
      fetchServicos();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao salvar serviço');
    }
  };

  const handleEdit = (servico: Servico) => {
    setEditingService(servico);
    setFormData({
      carro: servico.carro,
      placa: servico.placa,
      nome_cliente: servico.nome_cliente,
      telefone: servico.telefone || '',
      servico: servico.servico,
      valor: servico.valor.toString(),
      status: servico.status
    });
    setShowForm(true);
  };

  const handleDeleteRequest = async (servicoId: number) => {
    if (!window.confirm('Deseja solicitar a exclusão deste serviço?')) {
      return;
    }

    try {
      await servicosAPI.deleteServico(servicoId, 'Solicitação de exclusão pelo funcionário');
      alert('Solicitação de exclusão enviada para aprovação do administrador');
      fetchServicos();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao solicitar exclusão');
    }
  };

  const totalDia = servicos.reduce((sum, servico) => sum + servico.valor, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando serviços...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Meus Serviços - Hoje</h1>
        
        <button
          onClick={() => {
            setShowForm(true);
            setEditingService(null);
            setFormData({
              carro: '',
              placa: '',
              nome_cliente: '',
              telefone: '',
              servico: '',
              valor: '',
              status: 'concluido'
            });
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
        >
          + Adicionar Serviço
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Receita do Dia</p>
              <p className="text-2xl font-semibold">
                R$ {totalDia.toFixed(2).replace('.', ',')}
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
              <p className="text-sm font-medium text-gray-300">Serviços do Dia</p>
              <p className="text-2xl font-semibold">{servicos.length}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Service Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingService ? 'Editar Serviço' : 'Adicionar Serviço'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingService(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Carro *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.carro}
                    onChange={(e) => setFormData({ ...formData, carro: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Honda Civic"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Placa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: ABC-1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome_cliente}
                    onChange={(e) => setFormData({ ...formData, nome_cliente: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nome completo do cliente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Serviço *
                  </label>
                  <select
                    required
                    value={formData.servico}
                    onChange={(e) => setFormData({ ...formData, servico: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecione o serviço</option>
                    <option value="Lavagem Simples">Lavagem Simples</option>
                    <option value="Lavagem Completa">Lavagem Completa</option>
                    <option value="Enceramento">Enceramento</option>
                    <option value="Lavagem + Enceramento">Lavagem + Enceramento</option>
                    <option value="Aspiração">Aspiração</option>
                    <option value="Lavagem Premium">Lavagem Premium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="concluido">Concluído</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingService(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
                  >
                    {editingService ? 'Atualizar' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-white/20">
          <h2 className="text-lg font-semibold text-white">Serviços de Hoje</h2>
        </div>
        
        {servicos.length === 0 ? (
          <div className="p-6 text-center text-gray-300">
            <p>Nenhum serviço realizado hoje.</p>
            <p className="text-sm mt-1">Clique em "Adicionar Serviço" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Veículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Serviço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {servicos.map((servico) => (
                  <tr key={servico.id} className="text-white hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium">{servico.carro}</div>
                        <div className="text-gray-300 text-sm">{servico.placa}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium">{servico.nome_cliente}</div>
                        {servico.telefone && (
                          <div className="text-gray-300 text-sm">{servico.telefone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {servico.servico}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      R$ {servico.valor.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        servico.status === 'concluido' 
                          ? 'bg-green-100 text-green-800' 
                          : servico.status === 'em_andamento'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {servico.status === 'concluido' ? 'Concluído' : 
                         servico.status === 'em_andamento' ? 'Em Andamento' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(servico)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(servico.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Excluir
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
    </div>
  );
};

export default FuncionarioDashboard;