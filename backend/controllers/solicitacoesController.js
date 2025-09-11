const db = require('../db/connection');

// Get deletion requests (admin only)
const getSolicitacoes = async (req, res) => {
  try {
    const { status = 'pendente' } = req.query;

    const result = await db.query(
      `SELECT 
        sol.id,
        sol.servico_id,
        sol.funcionario_id,
        sol.motivo,
        sol.status,
        sol.data,
        sol.data_aprovacao,
        u1.nome as funcionario_nome,
        u2.nome as aprovado_por_nome,
        s.carro,
        s.placa,
        s.nome_cliente,
        s.servico,
        s.valor,
        s.data as data_servico
      FROM solicitacoes_exclusao sol
      LEFT JOIN users u1 ON sol.funcionario_id = u1.id
      LEFT JOIN users u2 ON sol.aprovada_por = u2.id
      LEFT JOIN servicos s ON sol.servico_id = s.id
      WHERE sol.status = $1
      ORDER BY sol.data DESC`,
      [status]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Get deletion request by ID (admin only)
const getSolicitacaoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT 
        sol.id,
        sol.servico_id,
        sol.funcionario_id,
        sol.motivo,
        sol.status,
        sol.data,
        sol.data_aprovacao,
        u1.nome as funcionario_nome,
        u2.nome as aprovado_por_nome,
        s.carro,
        s.placa,
        s.nome_cliente,
        s.servico,
        s.valor,
        s.data as data_servico
      FROM solicitacoes_exclusao sol
      LEFT JOIN users u1 ON sol.funcionario_id = u1.id
      LEFT JOIN users u2 ON sol.aprovada_por = u2.id
      LEFT JOIN servicos s ON sol.servico_id = s.id
      WHERE sol.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar solicitação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Approve or reject deletion request (admin only)
const processarSolicitacao = async (req, res) => {
  try {
    const { id } = req.params;
    const { acao, observacao } = req.body; // acao: 'aprovar' ou 'rejeitar'

    if (!['aprovar', 'rejeitar'].includes(acao)) {
      return res.status(400).json({ 
        error: 'Ação deve ser "aprovar" ou "rejeitar"' 
      });
    }

    // Check if request exists and is pending
    const solicitacao = await db.query(
      'SELECT * FROM solicitacoes_exclusao WHERE id = $1 AND status = $2',
      [id, 'pendente']
    );

    if (solicitacao.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Solicitação não encontrada ou já processada' 
      });
    }

    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      if (acao === 'aprovar') {
        // Delete the service
        await client.query(
          'DELETE FROM servicos WHERE id = $1',
          [solicitacao.rows[0].servico_id]
        );

        // Update request status
        await client.query(
          `UPDATE solicitacoes_exclusao 
           SET status = $1, aprovada_por = $2, data_aprovacao = CURRENT_TIMESTAMP
           WHERE id = $3`,
          ['aprovada', req.user.id, id]
        );
      } else {
        // Just update request status
        await client.query(
          `UPDATE solicitacoes_exclusao 
           SET status = $1, aprovada_por = $2, data_aprovacao = CURRENT_TIMESTAMP
           WHERE id = $3`,
          ['rejeitada', req.user.id, id]
        );
      }

      await client.query('COMMIT');

      const statusMessage = acao === 'aprovar' 
        ? 'Solicitação aprovada e serviço excluído'
        : 'Solicitação rejeitada';

      res.json({ message: statusMessage });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getSolicitacoes,
  getSolicitacaoById,
  processarSolicitacao
};