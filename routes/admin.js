const router = require('express').Router();
const auth = require('../middleware/auth');
const { pool } = require('../db');

const ADMIN_EMAIL = 'henriqur2511@gmail.com';

function requireAdmin(req, res, next) {
  if (req.user.email !== ADMIN_EMAIL) return res.status(403).json({ erro: 'Acesso negado' });
  next();
}

router.get('/usuarios', auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT email, nome, is_premium, premium_expiracao, criado_em
       FROM usuarios ORDER BY criado_em DESC`
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.post('/premium', auth, requireAdmin, async (req, res) => {
  const { email, ativo, dias } = req.body;
  if (!email) return res.status(400).json({ erro: 'email obrigatório' });
  try {
    let expiracao = null;
    if (ativo && dias && dias > 0) {
      expiracao = Date.now() + dias * 24 * 60 * 60 * 1000;
    }
    await pool.query(
      'UPDATE usuarios SET is_premium = $1, premium_expiracao = $2 WHERE email = $3',
      [ativo, expiracao, email.trim().toLowerCase()]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

module.exports = router;
