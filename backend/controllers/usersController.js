const bcrypt = require('bcrypt');
const db = require('../db/connection');

// Get all users (admin only)
const getUsers = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, role, nome, created_at FROM users ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Get user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT id, email, role, nome, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Create new user (admin only)
const createUser = async (req, res) => {
  try {
    const { email, password, role, nome } = req.body;

    // Validate required fields
    if (!email || !password || !role || !nome) {
      return res.status(400).json({
        error: 'Campos obrigatórios: email, password, role, nome'
      });
    }

    // Validate role
    if (!['admin', 'funcionario'].includes(role)) {
      return res.status(400).json({
        error: 'Role deve ser "admin" ou "funcionario"'
      });
    }

    // Check if email already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, role, nome)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, nome, created_at`,
      [email.toLowerCase(), passwordHash, role, nome]
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, role, nome } = req.body;

    // Check if user exists
    const existingUser = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const updateFields = [];
    const updateParams = [];
    let paramCount = 0;

    if (email !== undefined) {
      // Check if new email is already used by another user
      const emailCheck = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }

      paramCount++;
      updateFields.push(`email = $${paramCount}`);
      updateParams.push(email.toLowerCase());
    }

    if (password !== undefined) {
      const passwordHash = await bcrypt.hash(password, 10);
      paramCount++;
      updateFields.push(`password_hash = $${paramCount}`);
      updateParams.push(passwordHash);
    }

    if (role !== undefined) {
      if (!['admin', 'funcionario'].includes(role)) {
        return res.status(400).json({
          error: 'Role deve ser "admin" ou "funcionario"'
        });
      }
      paramCount++;
      updateFields.push(`role = $${paramCount}`);
      updateParams.push(role);
    }

    if (nome !== undefined) {
      paramCount++;
      updateFields.push(`nome = $${paramCount}`);
      updateParams.push(nome);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    paramCount++;
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateParams.push(id);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, role, nome, created_at, updated_at
    `;

    const result = await db.query(query, updateParams);

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Prevent deletion of the last admin
    if (existingUser.rows[0].role === 'admin') {
      const adminCount = await db.query(
        'SELECT COUNT(*) FROM users WHERE role = $1',
        ['admin']
      );

      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ 
          error: 'Não é possível excluir o último administrador' 
        });
      }
    }

    await db.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};