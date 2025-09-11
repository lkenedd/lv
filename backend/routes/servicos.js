const express = require('express');
const router = express.Router();
const {
  getServicos,
  getServicoById,
  createServico,
  updateServico,
  deleteServico,
  getEstatisticas
} = require('../controllers/servicosController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/servicos - Get services (with pagination and filtering)
router.get('/', getServicos);

// GET /api/servicos/estatisticas - Get statistics (admin only)
router.get('/estatisticas', requireRole(['admin']), getEstatisticas);

// GET /api/servicos/:id - Get service by ID
router.get('/:id', getServicoById);

// POST /api/servicos - Create new service
router.post('/', createServico);

// PUT /api/servicos/:id - Update service
router.put('/:id', updateServico);

// DELETE /api/servicos/:id - Delete service or request deletion
router.delete('/:id', deleteServico);

module.exports = router;