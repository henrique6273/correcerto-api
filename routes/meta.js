const router = require('express').Router();
const auth = require('../middleware/auth');
const { pool } = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM metas WHERE user_email = $1', [req.user.email]);
    res.json(result.rows[0] || { user_email: req.user.email, valor_diario: 200 });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.put('/', auth, async (req, res) => {
  const { valor_diario } = req.body;
  if (!valor_diario) return res.status(400).json({ erro: 'valor_diario obrigatório' });
  try {
    await pool.query(
      `INSERT INTO metas (user_email, valor_diario, atualizado_em)
       VALUES ($1, $2, EXTRACT(EPOCH FROM NOW()) * 1000)
       ON CONFLICT (user_email) DO UPDATE SET valor_diario=$2, atualizado_em=EXTRACT(EPOCH FROM NOW()) * 1000`,
      [req.user.email, valor_diario]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

module.exports = router;
