const express = require('express');
const router = express.Router();
const {
  getSolicitacoes,
  getSolicitacaoById,
  processarSolicitacao
} = require('../controllers/solicitacoesController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireRole(['admin']));

// GET /api/solicitacoes - Get deletion requests
router.get('/', getSolicitacoes);

// GET /api/solicitacoes/:id - Get deletion request by ID
router.get('/:id', getSolicitacaoById);

// PUT /api/solicitacoes/:id/processar - Approve or reject deletion request
router.put('/:id/processar', processarSolicitacao);

module.exports = router;