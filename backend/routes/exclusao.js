const express = require('express');
const { query } = require('../db/database');
const { authenticateToken, requireAdmin, requireEmployee } = require('../middleware/auth');

const router = express.Router();

// Get all deletion requests (admin only)
router.get('/requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status = 'pendente', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM solicitacoes_exclusao WHERE status = $1',
      [status]
    );

    // Get deletion requests
    const requests = await query(`
      SELECT 
        se.*,
        s.carro, s.placa, s.nome_cliente, s.servico, s.valor, s.data as servico_data,
        u1.nome as funcionario_nome,
        u2.nome as aprovado_por_nome
      FROM solicitacoes_exclusao se
      JOIN servicos s ON se.servico_id = s.id
      JOIN users u1 ON se.funcionario_id = u1.id
      LEFT JOIN users u2 ON se.aprovado_por = u2.id
      WHERE se.status = $1
      ORDER BY se.data DESC
      LIMIT $2 OFFSET $3
    `, [status, limit, offset]);

    res.json({
      requests: requests.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get deletion requests error:', error);
    res.status(500).json({ error: 'Error fetching deletion requests' });
  }
});

// Get deletion request by ID (admin only)
router.get('/requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const request = await query(`
      SELECT 
        se.*,
        s.carro, s.placa, s.nome_cliente, s.telefone, s.servico, s.valor, s.status as servico_status, s.data as servico_data,
        u1.nome as funcionario_nome, u1.email as funcionario_email,
        u2.nome as aprovado_por_nome
      FROM solicitacoes_exclusao se
      JOIN servicos s ON se.servico_id = s.id
      JOIN users u1 ON se.funcionario_id = u1.id
      LEFT JOIN users u2 ON se.aprovado_por = u2.id
      WHERE se.id = $1
    `, [id]);

    if (request.rows.length === 0) {
      return res.status(404).json({ error: 'Deletion request not found' });
    }

    res.json(request.rows[0]);
  } catch (error) {
    console.error('Get deletion request error:', error);
    res.status(500).json({ error: 'Error fetching deletion request' });
  }
});

// Approve or reject deletion request (admin only)
router.put('/requests/:id/decision', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, motivo } = req.body; // decision: 'aprovada' or 'rejeitada'

    if (!['aprovada', 'rejeitada'].includes(decision)) {
      return res.status(400).json({ 
        error: 'Decision must be either aprovada or rejeitada' 
      });
    }

    // Get the deletion request
    const requestResult = await query(
      'SELECT * FROM solicitacoes_exclusao WHERE id = $1 AND status = $2',
      [id, 'pendente']
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Deletion request not found or already processed' 
      });
    }

    const deletionRequest = requestResult.rows[0];

    // Update deletion request status
    await query(
      `UPDATE solicitacoes_exclusao 
       SET status = $1, aprovado_por = $2, data_aprovacao = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [decision, req.user.id, id]
    );

    // If approved, delete the service and update service record
    if (decision === 'aprovada') {
      // Mark service for deletion approval
      await query(
        'UPDATE servicos SET aprovacao_exclusao = $1 WHERE id = $2',
        ['aprovada', deletionRequest.servico_id]
      );

      // Actually delete the service
      const deletedService = await query(
        'DELETE FROM servicos WHERE id = $1 RETURNING *',
        [deletionRequest.servico_id]
      );

      res.json({
        message: 'Deletion request approved and service deleted successfully',
        deletedService: deletedService.rows[0]
      });
    } else {
      // If rejected, mark service as rejection
      await query(
        'UPDATE servicos SET aprovacao_exclusao = $1 WHERE id = $2',
        ['rejeitada', deletionRequest.servico_id]
      );

      res.json({
        message: 'Deletion request rejected successfully'
      });
    }
  } catch (error) {
    console.error('Process deletion request error:', error);
    res.status(500).json({ error: 'Error processing deletion request' });
  }
});

// Get deletion requests by employee (for employees to see their own requests)
router.get('/my-requests', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'se.funcionario_id = $1';
    const params = [req.user.id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereClause += ` AND se.status = $${paramCount}`;
      params.push(status);
    }

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total 
      FROM solicitacoes_exclusao se
      WHERE ${whereClause}
    `, params);

    // Get requests
    params.push(limit, offset);
    const requests = await query(`
      SELECT 
        se.*,
        s.carro, s.placa, s.nome_cliente, s.servico, s.valor, s.data as servico_data,
        u.nome as aprovado_por_nome
      FROM solicitacoes_exclusao se
      JOIN servicos s ON se.servico_id = s.id
      LEFT JOIN users u ON se.aprovado_por = u.id
      WHERE ${whereClause}
      ORDER BY se.data DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, params);

    res.json({
      requests: requests.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get my deletion requests error:', error);
    res.status(500).json({ error: 'Error fetching your deletion requests' });
  }
});

// Cancel deletion request (employee can cancel their own pending requests)
router.delete('/requests/:id', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;

    let whereClause = 'id = $1 AND status = $2';
    const params = [id, 'pendente'];

    // Employees can only cancel their own requests
    if (req.user.role === 'funcionario') {
      whereClause += ' AND funcionario_id = $3';
      params.push(req.user.id);
    }

    const deletedRequest = await query(
      `DELETE FROM solicitacoes_exclusao WHERE ${whereClause} RETURNING *`,
      params
    );

    if (deletedRequest.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Deletion request not found, already processed, or access denied' 
      });
    }

    res.json({
      message: 'Deletion request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel deletion request error:', error);
    res.status(500).json({ error: 'Error cancelling deletion request' });
  }
});

// Get deletion statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = 'DATE(data) = CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'data >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'data >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
      case 'total':
        dateFilter = '1=1';
        break;
      default:
        dateFilter = 'data >= CURRENT_DATE - INTERVAL \'30 days\'';
    }

    // Get deletion request statistics
    const stats = await query(`
      SELECT 
        COUNT(*) as total_solicitacoes,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status = 'aprovada' THEN 1 END) as aprovadas,
        COUNT(CASE WHEN status = 'rejeitada' THEN 1 END) as rejeitadas
      FROM solicitacoes_exclusao
      WHERE ${dateFilter}
    `);

    // Get requests by employee
    const employeeStats = await query(`
      SELECT 
        u.nome as funcionario_nome,
        COUNT(se.id) as total_solicitacoes,
        COUNT(CASE WHEN se.status = 'aprovada' THEN 1 END) as aprovadas,
        COUNT(CASE WHEN se.status = 'rejeitada' THEN 1 END) as rejeitadas
      FROM users u
      LEFT JOIN solicitacoes_exclusao se ON u.id = se.funcionario_id AND ${dateFilter}
      WHERE u.role = 'funcionario'
      GROUP BY u.id, u.nome
      ORDER BY total_solicitacoes DESC
    `);

    res.json({
      stats: stats.rows[0],
      employeeStats: employeeStats.rows,
      period
    });
  } catch (error) {
    console.error('Get deletion stats error:', error);
    res.status(500).json({ error: 'Error fetching deletion statistics' });
  }
});

module.exports = router;