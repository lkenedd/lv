const db = require('../db/connection');

// Get all services (Admin) or user's services (Funcionario)
const getServicos = async (req, res) => {
  try {
    const { page = 1, limit = 10, data_inicio, data_fim, funcionario_id } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, u.nome as funcionario_nome 
      FROM servicos s 
      LEFT JOIN users u ON s.funcionario_id = u.id 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Role-based filtering
    if (req.user.role === 'funcionario') {
      paramCount++;
      query += ` AND s.funcionario_id = $${paramCount}`;
      params.push(req.user.id);
    } else if (funcionario_id) {
      paramCount++;
      query += ` AND s.funcionario_id = $${paramCount}`;
      params.push(funcionario_id);
    }

    // Date filtering
    if (data_inicio) {
      paramCount++;
      query += ` AND s.data >= $${paramCount}`;
      params.push(data_inicio);
    }
    if (data_fim) {
      paramCount++;
      query += ` AND s.data <= $${paramCount}`;
      params.push(data_fim + ' 23:59:59');
    }

    query += ` ORDER BY s.data DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM servicos s WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (req.user.role === 'funcionario') {
      countParamCount++;
      countQuery += ` AND s.funcionario_id = $${countParamCount}`;
      countParams.push(req.user.id);
    } else if (funcionario_id) {
      countParamCount++;
      countQuery += ` AND s.funcionario_id = $${countParamCount}`;
      countParams.push(funcionario_id);
    }

    if (data_inicio) {
      countParamCount++;
      countQuery += ` AND s.data >= $${countParamCount}`;
      countParams.push(data_inicio);
    }
    if (data_fim) {
      countParamCount++;
      countQuery += ` AND s.data <= $${countParamCount}`;
      countParams.push(data_fim + ' 23:59:59');
    }

    const countResult = await db.query(countQuery, countParams);
    const totalItems = parseInt(countResult.rows[0].count);

    res.json({
      servicos: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Get service by ID
const getServicoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = `
      SELECT s.*, u.nome as funcionario_nome 
      FROM servicos s 
      LEFT JOIN users u ON s.funcionario_id = u.id 
      WHERE s.id = $1
    `;
    const params = [id];

    // If funcionario, only allow access to their own services
    if (req.user.role === 'funcionario') {
      query += ' AND s.funcionario_id = $2';
      params.push(req.user.id);
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Create new service
const createServico = async (req, res) => {
  try {
    const {
      carro,
      placa,
      nome_cliente,
      telefone,
      servico,
      valor,
      status = 'concluido'
    } = req.body;

    // Validate required fields
    if (!carro || !placa || !nome_cliente || !servico || !valor) {
      return res.status(400).json({
        error: 'Campos obrigatórios: carro, placa, nome_cliente, servico, valor'
      });
    }

    const result = await db.query(
      `INSERT INTO servicos (carro, placa, nome_cliente, telefone, servico, valor, status, funcionario_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [carro, placa, nome_cliente, telefone, servico, valor, status, req.user.id]
    );

    res.status(201).json({
      message: 'Serviço criado com sucesso',
      servico: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Update service
const updateServico = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      carro,
      placa,
      nome_cliente,
      telefone,
      servico,
      valor,
      status
    } = req.body;

    // Check if service exists and user has permission
    let checkQuery = 'SELECT * FROM servicos WHERE id = $1';
    const checkParams = [id];

    if (req.user.role === 'funcionario') {
      checkQuery += ' AND funcionario_id = $2';
      checkParams.push(req.user.id);
    }

    const checkResult = await db.query(checkQuery, checkParams);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado ou sem permissão' });
    }

    const updateFields = [];
    const updateParams = [];
    let paramCount = 0;

    if (carro !== undefined) {
      paramCount++;
      updateFields.push(`carro = $${paramCount}`);
      updateParams.push(carro);
    }
    if (placa !== undefined) {
      paramCount++;
      updateFields.push(`placa = $${paramCount}`);
      updateParams.push(placa);
    }
    if (nome_cliente !== undefined) {
      paramCount++;
      updateFields.push(`nome_cliente = $${paramCount}`);
      updateParams.push(nome_cliente);
    }
    if (telefone !== undefined) {
      paramCount++;
      updateFields.push(`telefone = $${paramCount}`);
      updateParams.push(telefone);
    }
    if (servico !== undefined) {
      paramCount++;
      updateFields.push(`servico = $${paramCount}`);
      updateParams.push(servico);
    }
    if (valor !== undefined) {
      paramCount++;
      updateFields.push(`valor = $${paramCount}`);
      updateParams.push(valor);
    }
    if (status !== undefined) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      updateParams.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    paramCount++;
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateParams.push(id);

    const query = `
      UPDATE servicos 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, updateParams);

    res.json({
      message: 'Serviço atualizado com sucesso',
      servico: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Request service deletion (funcionario) or delete directly (admin)
const deleteServico = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    // Check if service exists
    const serviceResult = await db.query('SELECT * FROM servicos WHERE id = $1', [id]);
    
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    const servico = serviceResult.rows[0];

    if (req.user.role === 'admin') {
      // Admin can delete directly
      await db.query('DELETE FROM servicos WHERE id = $1', [id]);
      res.json({ message: 'Serviço excluído com sucesso' });
    } else if (req.user.role === 'funcionario') {
      // Funcionario can only request deletion of their own services
      if (servico.funcionario_id !== req.user.id) {
        return res.status(403).json({ error: 'Você só pode solicitar exclusão dos seus próprios serviços' });
      }

      // Check if there's already a pending request
      const existingRequest = await db.query(
        'SELECT * FROM solicitacoes_exclusao WHERE servico_id = $1 AND status = $2',
        [id, 'pendente']
      );

      if (existingRequest.rows.length > 0) {
        return res.status(400).json({ error: 'Já existe uma solicitação de exclusão pendente para este serviço' });
      }

      // Create deletion request
      await db.query(
        'INSERT INTO solicitacoes_exclusao (servico_id, funcionario_id, motivo) VALUES ($1, $2, $3)',
        [id, req.user.id, motivo || 'Solicitação de exclusão']
      );

      res.json({ message: 'Solicitação de exclusão enviada para aprovação' });
    } else {
      res.status(403).json({ error: 'Permissão insuficiente' });
    }
  } catch (error) {
    console.error('Erro ao excluir serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Get service statistics (admin only)
const getEstatisticas = async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;
    
    let dateFilter = '';
    if (periodo === 'dia') {
      dateFilter = "AND data >= CURRENT_DATE";
    } else if (periodo === 'semana') {
      dateFilter = "AND data >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (periodo === 'mes') {
      dateFilter = "AND data >= CURRENT_DATE - INTERVAL '30 days'";
    }

    // Total revenue
    const revenueResult = await db.query(
      `SELECT COALESCE(SUM(valor), 0) as total_receita FROM servicos WHERE 1=1 ${dateFilter}`
    );

    // Total services
    const servicesResult = await db.query(
      `SELECT COUNT(*) as total_servicos FROM servicos WHERE 1=1 ${dateFilter}`
    );

    // Services by type
    const serviceTypeResult = await db.query(
      `SELECT servico, COUNT(*) as quantidade, SUM(valor) as receita 
       FROM servicos WHERE 1=1 ${dateFilter}
       GROUP BY servico ORDER BY quantidade DESC`
    );

    // Daily revenue (last 7 days)
    const dailyRevenueResult = await db.query(
      `SELECT DATE(data) as dia, COUNT(*) as servicos, SUM(valor) as receita
       FROM servicos 
       WHERE data >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(data) 
       ORDER BY dia`
    );

    res.json({
      periodo,
      total_receita: parseFloat(revenueResult.rows[0].total_receita),
      total_servicos: parseInt(servicesResult.rows[0].total_servicos),
      servicos_por_tipo: serviceTypeResult.rows,
      receita_diaria: dailyRevenueResult.rows
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getServicos,
  getServicoById,
  createServico,
  updateServico,
  deleteServico,
  getEstatisticas
};