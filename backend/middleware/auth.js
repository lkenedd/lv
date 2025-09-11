const jwt = require('jsonwebtoken');
const db = require('../db/connection');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }

    try {
      // Get user data from database
      const result = await db.query(
        'SELECT id, email, role, nome FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Usuário não encontrado' });
      }

      req.user = result.rows[0];
      next();
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissão insuficiente' });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};