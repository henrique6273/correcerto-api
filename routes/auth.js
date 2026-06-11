const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const PREMIUM_EMAIL = 'henriqur2511@gmail.com';

function isPremiumAtivo(user) {
  if (!user.is_premium) return false;
  if (user.premium_expiracao === null || user.premium_expiracao === undefined) return true;
  return Date.now() < user.premium_expiracao;
}

router.post('/cadastro', async (req, res) => {
  const { email, nome } = req.body;
  if (!email || !nome) return res.status(400).json({ erro: 'email e nome obrigatórios' });
  try {
    const emailNorm = email.trim().toLowerCase();
    const isPremium = emailNorm === PREMIUM_EMAIL;
    await pool.query(
      `INSERT INTO usuarios (email, nome, is_premium)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome`,
      [emailNorm, nome.trim(), isPremium]
    );
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [emailNorm]);
    const user = result.rows[0];
    const ativo = isPremiumAtivo(user);
    const token = jwt.sign({ email: emailNorm }, process.env.JWT_SECRET, { expiresIn: '365d' });
    res.json({ token, email: emailNorm, nome: nome.trim(), isPremium: ativo, premiumExpiracao: user.premium_expiracao ?? null });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.post('/login', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ erro: 'email obrigatório' });
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.trim().toLowerCase()]);
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado' });
    const user = result.rows[0];
    const ativo = isPremiumAtivo(user);
    if (user.is_premium && !ativo) {
      await pool.query('UPDATE usuarios SET is_premium = FALSE WHERE email = $1', [user.email]);
    }
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '365d' });
    res.json({ token, email: user.email, nome: user.nome, isPremium: ativo, premiumExpiracao: user.premium_expiracao ?? null });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.get('/status', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT is_premium, premium_expiracao FROM usuarios WHERE email = $1', [req.user.email]);
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado' });
    const user = result.rows[0];
    const ativo = isPremiumAtivo(user);
    if (user.is_premium && !ativo) {
      await pool.query('UPDATE usuarios SET is_premium = FALSE WHERE email = $1', [req.user.email]);
    }
    res.json({ isPremium: ativo, premiumExpiracao: user.premium_expiracao ?? null });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

module.exports = router;
