const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.query;
    
    let whereClause = '1=1';
    const params = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      whereClause += ` AND role = $${paramCount}`;
      params.push(role);
    }

    const users = await query(`
      SELECT id, email, role, nome, created_at, updated_at
      FROM users 
      WHERE ${whereClause}
      ORDER BY created_at DESC
    `, params);

    res.json(users.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await query(
      'SELECT id, email, role, nome, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, nome, password } = req.body;

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare update query
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (email !== undefined) {
      paramCount++;
      updates.push(`email = $${paramCount}`);
      params.push(email);

      // Check if email is already taken by another user
      const emailCheck = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Email already in use by another user' });
      }
    }

    if (nome !== undefined) {
      paramCount++;
      updates.push(`nome = $${paramCount}`);
      params.push(nome);
    }

    if (role !== undefined) {
      if (!['admin', 'funcionario'].includes(role)) {
        return res.status(400).json({ 
          error: 'Role must be either admin or funcionario' 
        });
      }
      paramCount++;
      updates.push(`role = $${paramCount}`);
      params.push(role);
    }

    if (password !== undefined && password.trim() !== '') {
      // Hash new password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      paramCount++;
      updates.push(`password_hash = $${paramCount}`);
      params.push(passwordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add WHERE clause parameter
    params.push(id);

    // Update user
    const updatedUser = await query(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING id, email, role, nome, updated_at
    `, params);

    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Email already in use' });
    } else {
      res.status(500).json({ error: 'Error updating user' });
    }
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user has associated services
    const servicesCount = await query(
      'SELECT COUNT(*) as count FROM servicos WHERE funcionario_id = $1',
      [id]
    );

    if (parseInt(servicesCount.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user with associated services. Consider deactivating instead.' 
      });
    }

    // Delete user
    const deletedUser = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id, email, nome',
      [id]
    );

    if (deletedUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'User deleted successfully',
      deletedUser: deletedUser.rows[0]
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Error deleting user' });
  }
});

// Get user statistics (admin only)
router.get('/:id/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
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

    const stats = await query(`
      SELECT 
        COUNT(*) as total_servicos,
        COUNT(CASE WHEN status = 'finalizado' THEN 1 END) as servicos_finalizados,
        COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as servicos_andamento,
        COALESCE(SUM(CASE WHEN status = 'finalizado' THEN valor ELSE 0 END), 0) as receita_gerada,
        COALESCE(AVG(CASE WHEN status = 'finalizado' THEN valor ELSE NULL END), 0) as ticket_medio
      FROM servicos 
      WHERE funcionario_id = $1 AND ${dateFilter}
    `, [id]);

    // Get services per day for the last 7 days
    const dailyStats = await query(`
      SELECT 
        DATE(data) as data,
        COUNT(*) as servicos,
        SUM(CASE WHEN status = 'finalizado' THEN valor ELSE 0 END) as receita
      FROM servicos 
      WHERE funcionario_id = $1 AND data >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(data)
      ORDER BY data
    `, [id]);

    res.json({
      stats: stats.rows[0],
      dailyStats: dailyStats.rows,
      period
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Error fetching user statistics' });
  }
});

module.exports = router;