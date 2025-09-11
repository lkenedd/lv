const express = require('express');
const { query } = require('../db/database');
const { authenticateToken, requireEmployee } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    let dateFilter = '';
    let dateParam = [];

    // Set date filter based on period
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
        dateFilter = 'DATE(data) = CURRENT_DATE';
    }

    // Get service statistics
    const servicesStats = await query(`
      SELECT 
        COUNT(*) as total_servicos,
        COUNT(CASE WHEN status = 'finalizado' THEN 1 END) as servicos_finalizados,
        COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as servicos_andamento,
        COALESCE(SUM(CASE WHEN status = 'finalizado' THEN valor ELSE 0 END), 0) as receita_total
      FROM servicos 
      WHERE ${dateFilter}
    `);

    // Get services by day for chart (last 7 days)
    const servicesChart = await query(`
      SELECT 
        DATE(data) as data,
        COUNT(*) as total_servicos,
        SUM(CASE WHEN status = 'finalizado' THEN valor ELSE 0 END) as receita
      FROM servicos 
      WHERE data >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(data)
      ORDER BY data
    `);

    // Get services by type for pie chart
    const serviceTypes = await query(`
      SELECT 
        servico,
        COUNT(*) as quantidade,
        SUM(CASE WHEN status = 'finalizado' THEN valor ELSE 0 END) as receita
      FROM servicos 
      WHERE ${dateFilter}
      GROUP BY servico
      ORDER BY quantidade DESC
    `);

    // Get top employees (admin only)
    let topEmployees = [];
    if (req.user.role === 'admin') {
      topEmployees = await query(`
        SELECT 
          u.nome,
          COUNT(s.id) as total_servicos,
          SUM(CASE WHEN s.status = 'finalizado' THEN s.valor ELSE 0 END) as receita_gerada
        FROM users u
        LEFT JOIN servicos s ON u.id = s.funcionario_id
        WHERE u.role = 'funcionario' AND (${dateFilter} OR s.id IS NULL)
        GROUP BY u.id, u.nome
        ORDER BY receita_gerada DESC
      `);
    }

    // Recent services
    const recentServices = await query(`
      SELECT 
        id, carro, placa, nome_cliente, servico, valor, status, data,
        u.nome as funcionario_nome
      FROM servicos s
      LEFT JOIN users u ON s.funcionario_id = u.id
      WHERE ${dateFilter}
      ORDER BY data DESC
      LIMIT 10
    `);

    res.json({
      stats: servicesStats.rows[0],
      charts: {
        servicesChart: servicesChart.rows,
        serviceTypes: serviceTypes.rows
      },
      topEmployees: topEmployees,
      recentServices: recentServices.rows,
      period
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Error fetching dashboard statistics' });
  }
});

// Get monthly revenue chart
router.get('/revenue-chart', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const revenueData = await query(`
      SELECT 
        TO_CHAR(data, 'YYYY-MM') as mes,
        COUNT(*) as total_servicos,
        SUM(CASE WHEN status = 'finalizado' THEN valor ELSE 0 END) as receita
      FROM servicos 
      WHERE data >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
      GROUP BY TO_CHAR(data, 'YYYY-MM')
      ORDER BY mes
    `);

    res.json(revenueData.rows);
  } catch (error) {
    console.error('Revenue chart error:', error);
    res.status(500).json({ error: 'Error fetching revenue chart data' });
  }
});

// Get service status distribution
router.get('/status-distribution', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const statusData = await query(`
      SELECT 
        status,
        COUNT(*) as quantidade,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentual
      FROM servicos 
      WHERE DATE(data) = CURRENT_DATE
      GROUP BY status
    `);

    res.json(statusData.rows);
  } catch (error) {
    console.error('Status distribution error:', error);
    res.status(500).json({ error: 'Error fetching status distribution' });
  }
});

module.exports = router;