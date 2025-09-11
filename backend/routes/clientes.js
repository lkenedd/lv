const express = require('express');
const { query } = require('../db/database');
const { authenticateToken, requireEmployee } = require('../middleware/auth');

const router = express.Router();

// Get all clients with pagination and search
router.get('/', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = '1=1';
    let params = [];
    let paramCount = 0;

    // Search filter
    if (search) {
      paramCount++;
      whereClause += ` AND (nome ILIKE $${paramCount} OR telefone ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total 
      FROM clientes
      WHERE ${whereClause}
    `, params);

    // Get clients with service count
    params.push(limit, offset);
    const clientsResult = await query(`
      SELECT 
        c.*,
        (
          SELECT COUNT(*)
          FROM servicos s 
          WHERE s.telefone = c.telefone
        ) as total_servicos,
        (
          SELECT COALESCE(SUM(valor), 0)
          FROM servicos s 
          WHERE s.telefone = c.telefone AND s.status = 'finalizado'
        ) as valor_total_gasto
      FROM clientes c
      WHERE ${whereClause}
      ORDER BY c.updated_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, params);

    res.json({
      clients: clientsResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Error fetching clients' });
  }
});

// Get client by ID
router.get('/:id', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;

    const clientResult = await query(`
      SELECT 
        c.*,
        (
          SELECT COUNT(*)
          FROM servicos s 
          WHERE s.telefone = c.telefone
        ) as total_servicos,
        (
          SELECT COALESCE(SUM(valor), 0)
          FROM servicos s 
          WHERE s.telefone = c.telefone AND s.status = 'finalizado'
        ) as valor_total_gasto
      FROM clientes c
      WHERE c.id = $1
    `, [id]);

    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(clientResult.rows[0]);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Error fetching client' });
  }
});

// Get client service history
router.get('/:id/services', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // First get client info
    const clientResult = await query(
      'SELECT telefone FROM clientes WHERE id = $1',
      [id]
    );

    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const telefone = clientResult.rows[0].telefone;
    const offset = (page - 1) * limit;

    // Get total services count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM servicos WHERE telefone = $1',
      [telefone]
    );

    // Get services
    const servicesResult = await query(`
      SELECT 
        s.*,
        u.nome as funcionario_nome
      FROM servicos s
      LEFT JOIN users u ON s.funcionario_id = u.id
      WHERE s.telefone = $1
      ORDER BY s.data DESC
      LIMIT $2 OFFSET $3
    `, [telefone, limit, offset]);

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
    console.error('Get client services error:', error);
    res.status(500).json({ error: 'Error fetching client services' });
  }
});

// Search clients by phone or name
router.get('/search/:query', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { query: searchQuery } = req.params;
    const { limit = 5 } = req.query;

    const clients = await query(`
      SELECT 
        c.*,
        (
          SELECT COUNT(*)
          FROM servicos s 
          WHERE s.telefone = c.telefone
        ) as total_servicos
      FROM clientes c
      WHERE c.nome ILIKE $1 OR c.telefone ILIKE $1
      ORDER BY c.updated_at DESC
      LIMIT $2
    `, [`%${searchQuery}%`, limit]);

    res.json(clients.rows);
  } catch (error) {
    console.error('Search clients error:', error);
    res.status(500).json({ error: 'Error searching clients' });
  }
});

// Update client
router.put('/:id', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, telefone } = req.body;

    // Check if client exists
    const existingClient = await query(
      'SELECT * FROM clientes WHERE id = $1',
      [id]
    );

    if (existingClient.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Prepare update query
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (nome !== undefined) {
      paramCount++;
      updates.push(`nome = $${paramCount}`);
      params.push(nome);
    }

    if (telefone !== undefined) {
      // Check if new phone number is already used by another client
      const phoneCheck = await query(
        'SELECT id FROM clientes WHERE telefone = $1 AND id != $2',
        [telefone, id]
      );

      if (phoneCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Phone number already in use by another client' });
      }

      paramCount++;
      updates.push(`telefone = $${paramCount}`);
      params.push(telefone);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add WHERE clause parameter
    params.push(id);

    // Update client
    const updatedClient = await query(`
      UPDATE clientes 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING *
    `, params);

    // If telefone was updated, update all related services
    if (telefone !== undefined && telefone !== existingClient.rows[0].telefone) {
      await query(
        'UPDATE servicos SET telefone = $1 WHERE telefone = $2',
        [telefone, existingClient.rows[0].telefone]
      );
    }

    // If nome was updated, update recent services with same telefone
    if (nome !== undefined && nome !== existingClient.rows[0].nome) {
      await query(`
        UPDATE servicos 
        SET nome_cliente = $1 
        WHERE telefone = $2 AND data >= CURRENT_DATE - INTERVAL '30 days'
      `, [nome, updatedClient.rows[0].telefone]);
    }

    res.json(updatedClient.rows[0]);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Error updating client' });
  }
});

// Get client statistics
router.get('/:id/stats', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;

    // Get client phone
    const clientResult = await query(
      'SELECT telefone FROM clientes WHERE id = $1',
      [id]
    );

    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const telefone = clientResult.rows[0].telefone;

    // Get statistics
    const stats = await query(`
      SELECT 
        COUNT(*) as total_servicos,
        COUNT(CASE WHEN status = 'finalizado' THEN 1 END) as servicos_finalizados,
        COALESCE(SUM(CASE WHEN status = 'finalizado' THEN valor ELSE 0 END), 0) as valor_total_gasto,
        COALESCE(AVG(CASE WHEN status = 'finalizado' THEN valor ELSE NULL END), 0) as ticket_medio,
        MAX(data) as ultima_visita,
        MIN(data) as primeira_visita
      FROM servicos 
      WHERE telefone = $1
    `, [telefone]);

    // Get favorite services
    const favoriteServices = await query(`
      SELECT 
        servico,
        COUNT(*) as quantidade,
        AVG(valor) as valor_medio
      FROM servicos 
      WHERE telefone = $1 AND status = 'finalizado'
      GROUP BY servico
      ORDER BY quantidade DESC, valor_medio DESC
      LIMIT 5
    `, [telefone]);

    // Get monthly spending
    const monthlySpending = await query(`
      SELECT 
        TO_CHAR(data, 'YYYY-MM') as mes,
        COUNT(*) as servicos,
        SUM(valor) as total_gasto
      FROM servicos 
      WHERE telefone = $1 AND status = 'finalizado'
        AND data >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(data, 'YYYY-MM')
      ORDER BY mes DESC
    `, [telefone]);

    res.json({
      stats: stats.rows[0],
      favoriteServices: favoriteServices.rows,
      monthlySpending: monthlySpending.rows
    });
  } catch (error) {
    console.error('Get client stats error:', error);
    res.status(500).json({ error: 'Error fetching client statistics' });
  }
});

module.exports = router;