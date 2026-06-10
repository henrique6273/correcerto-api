const router = require('express').Router();
const auth = require('../middleware/auth');
const { pool } = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM despesas WHERE user_email = $1 ORDER BY data DESC, criado_em DESC',
      [req.user.email]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { id, valor, categoria, data, descricao } = req.body;
  // FIX #10: usa == null para não rejeitar valor 0
  if (!id || valor == null || !categoria || !data) return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
  try {
    await pool.query(
      `INSERT INTO despesas (id, user_email, valor, categoria, data, descricao)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET valor=$3, categoria=$4, data=$5, descricao=$6`,
      [id, req.user.email, valor, categoria, data, descricao || '']
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM despesas WHERE id = $1 AND user_email = $2', [req.params.id, req.user.email]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

module.exports = router;
