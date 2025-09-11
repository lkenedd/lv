const express = require('express');
const { query } = require('../db/database');
const { authenticateToken, requireEmployee, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all services with pagination and filters
router.get('/', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      funcionario_id,
      date_from,
      date_to,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = '1=1';
    let params = [];
    let paramCount = 0;

    // Filter by status
    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
    }

    // Filter by employee (funcionarios can only see their own services)
    if (req.user.role === 'funcionario') {
      paramCount++;
      whereClause += ` AND funcionario_id = $${paramCount}`;
      params.push(req.user.id);
    } else if (funcionario_id) {
      // Admins can filter by specific employee
      paramCount++;
      whereClause += ` AND funcionario_id = $${paramCount}`;
      params.push(funcionario_id);
    }

    // Date range filter
    if (date_from) {
      paramCount++;
      whereClause += ` AND DATE(data) >= $${paramCount}`;
      params.push(date_from);
    }
    if (date_to) {
      paramCount++;
      whereClause += ` AND DATE(data) <= $${paramCount}`;
      params.push(date_to);
    }

    // Search filter
    if (search) {
      paramCount++;
      whereClause += ` AND (nome_cliente ILIKE $${paramCount} OR placa ILIKE $${paramCount} OR carro ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total 
      FROM servicos s
      LEFT JOIN users u ON s.funcionario_id = u.id
      WHERE ${whereClause}
    `, params);

    // Get services
    params.push(limit, offset);
    const servicesResult = await query(`
      SELECT 
        s.*,
        u.nome as funcionario_nome
      FROM servicos s
      LEFT JOIN users u ON s.funcionario_id = u.id
      WHERE ${whereClause}
      ORDER BY s.data DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, params);

    res.json({
      services: servicesResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Error fetching services' });
  }
});

// Get service by ID
router.get('/:id', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    let whereClause = 's.id = $1';
    let params = [id];

    // Funcionarios can only see their own services
    if (req.user.role === 'funcionario') {
      whereClause += ' AND s.funcionario_id = $2';
      params.push(req.user.id);
    }

    const serviceResult = await query(`
      SELECT 
        s.*,
        u.nome as funcionario_nome
      FROM servicos s
      LEFT JOIN users u ON s.funcionario_id = u.id
      WHERE ${whereClause}
    `, params);

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(serviceResult.rows[0]);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Error fetching service' });
  }
});

// Create new service
router.post('/', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { 
      carro, 
      placa, 
      nome_cliente, 
      telefone, 
      servico, 
      valor, 
      status = 'em_andamento' 
    } = req.body;

    // Validation
    if (!carro || !placa || !nome_cliente || !telefone || !servico || !valor) {
      return res.status(400).json({ 
        error: 'All fields are required: carro, placa, nome_cliente, telefone, servico, valor' 
      });
    }

    if (!['em_andamento', 'finalizado'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status must be either em_andamento or finalizado' 
      });
    }

    // Create service
    const newService = await query(`
      INSERT INTO servicos (carro, placa, nome_cliente, telefone, servico, valor, status, funcionario_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [carro, placa, nome_cliente, telefone, servico, parseFloat(valor), status, req.user.id]);

    // Update or create client
    const existingClient = await query(
      'SELECT id FROM clientes WHERE telefone = $1',
      [telefone]
    );

    if (existingClient.rows.length === 0) {
      // Create new client
      await query(
        'INSERT INTO clientes (nome, telefone, historico_servicos) VALUES ($1, $2, $3)',
        [nome_cliente, telefone, JSON.stringify([newService.rows[0].id])]
      );
    } else {
      // Update existing client's service history
      await query(`
        UPDATE clientes 
        SET historico_servicos = historico_servicos || $1::jsonb,
            nome = $2
        WHERE telefone = $3
      `, [JSON.stringify([newService.rows[0].id]), nome_cliente, telefone]);
    }

    res.status(201).json(newService.rows[0]);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Error creating service' });
  }
});

// Update service
router.put('/:id', authenticateToken, requireEmployee, async (req, res) => {
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
    let whereClause = 'id = $1';
    let params = [id];

    // Funcionarios can only edit their own services
    if (req.user.role === 'funcionario') {
      whereClause += ' AND funcionario_id = $2';
      params.push(req.user.id);
    }

    const existingService = await query(`
      SELECT * FROM servicos WHERE ${whereClause}
    `, params);

    if (existingService.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found or access denied' });
    }

    // Prepare update query
    const updates = [];
    const updateParams = [];
    let paramCount = 0;

    if (carro !== undefined) {
      paramCount++;
      updates.push(`carro = $${paramCount}`);
      updateParams.push(carro);
    }
    if (placa !== undefined) {
      paramCount++;
      updates.push(`placa = $${paramCount}`);
      updateParams.push(placa);
    }
    if (nome_cliente !== undefined) {
      paramCount++;
      updates.push(`nome_cliente = $${paramCount}`);
      updateParams.push(nome_cliente);
    }
    if (telefone !== undefined) {
      paramCount++;
      updates.push(`telefone = $${paramCount}`);
      updateParams.push(telefone);
    }
    if (servico !== undefined) {
      paramCount++;
      updates.push(`servico = $${paramCount}`);
      updateParams.push(servico);
    }
    if (valor !== undefined) {
      paramCount++;
      updates.push(`valor = $${paramCount}`);
      updateParams.push(parseFloat(valor));
    }
    if (status !== undefined) {
      if (!['em_andamento', 'finalizado'].includes(status)) {
        return res.status(400).json({ 
          error: 'Status must be either em_andamento or finalizado' 
        });
      }
      paramCount++;
      updates.push(`status = $${paramCount}`);
      updateParams.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add WHERE clause parameters
    updateParams.push(id);
    let finalWhereClause = `id = $${paramCount + 1}`;
    
    if (req.user.role === 'funcionario') {
      updateParams.push(req.user.id);
      finalWhereClause += ` AND funcionario_id = $${paramCount + 2}`;
    }

    // Update service
    const updatedService = await query(`
      UPDATE servicos 
      SET ${updates.join(', ')}
      WHERE ${finalWhereClause}
      RETURNING *
    `, updateParams);

    if (updatedService.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found or access denied' });
    }

    res.json(updatedService.rows[0]);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Error updating service' });
  }
});

// Delete service (admin only or with approval)
router.delete('/:id', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'admin') {
      // Admin can delete directly
      const deletedService = await query(
        'DELETE FROM servicos WHERE id = $1 RETURNING *',
        [id]
      );

      if (deletedService.rows.length === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      res.json({ message: 'Service deleted successfully' });
    } else {
      // Employee must request deletion approval
      const serviceResult = await query(
        'SELECT * FROM servicos WHERE id = $1 AND funcionario_id = $2',
        [id, req.user.id]
      );

      if (serviceResult.rows.length === 0) {
        return res.status(404).json({ error: 'Service not found or access denied' });
      }

      // Check if deletion request already exists
      const existingRequest = await query(
        'SELECT * FROM solicitacoes_exclusao WHERE servico_id = $1 AND status = $2',
        [id, 'pendente']
      );

      if (existingRequest.rows.length > 0) {
        return res.status(409).json({ error: 'Deletion request already exists and is pending approval' });
      }

      // Create deletion request
      const { motivo } = req.body;
      await query(
        'INSERT INTO solicitacoes_exclusao (servico_id, funcionario_id, motivo) VALUES ($1, $2, $3)',
        [id, req.user.id, motivo || 'Solicitação de exclusão']
      );

      res.json({ message: 'Deletion request submitted for admin approval' });
    }
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Error processing service deletion' });
  }
});

module.exports = router;