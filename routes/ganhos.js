const router = require('express').Router();
const auth = require('../middleware/auth');
const { pool } = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ganhos WHERE user_email = $1 ORDER BY data DESC, criado_em DESC',
      [req.user.email]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { id, valor, plataforma, data, descricao, corridas } = req.body;
  // FIX #10: usa == null para não rejeitar valor 0
  if (!id || valor == null || !plataforma || !data) return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
  try {
    await pool.query(
      `INSERT INTO ganhos (id, user_email, valor, plataforma, data, descricao, corridas)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET valor=$3, plataforma=$4, data=$5, descricao=$6, corridas=$7`,
      [id, req.user.email, valor, plataforma, data, descricao || '', corridas || 0]
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM ganhos WHERE id = $1 AND user_email = $2', [req.params.id, req.user.email]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

module.exports = router;
