const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const PREMIUM_EMAIL = 'henriqur2511@gmail.com';

router.post('/cadastro', async (req, res) => {
  const { email, nome } = req.body;
  if (!email || !nome) return res.status(400).json({ erro: 'email e nome obrigatórios' });
  try {
    const isPremium = email.trim().toLowerCase() === PREMIUM_EMAIL;
    await pool.query(
      `INSERT INTO usuarios (email, nome, is_premium)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome`,
      [email.trim().toLowerCase(), nome.trim(), isPremium]
    );
    const token = jwt.sign({ email: email.trim().toLowerCase() }, process.env.JWT_SECRET, { expiresIn: '365d' });
    res.json({ token, email: email.trim().toLowerCase(), nome: nome.trim(), isPremium });
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
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '365d' });
    res.json({ token, email: user.email, nome: user.nome, isPremium: user.is_premium });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

module.exports = router;
