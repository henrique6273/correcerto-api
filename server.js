const express = require('express');
const cors = require('cors');
const { init } = require('./db');

// FIX #9: valida JWT_SECRET antes de iniciar o servidor
if (!process.env.JWT_SECRET) {
  console.error('ERRO FATAL: variável JWT_SECRET não configurada. Defina ela nas variáveis de ambiente.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/ganhos', require('./routes/ganhos'));
app.use('/despesas', require('./routes/despesas'));
app.use('/meta', require('./routes/meta'));
app.use('/version', require('./routes/version'));

const { pool } = require('./db');
app.get('/download', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT apk_url FROM app_versions WHERE apk_url != '' ORDER BY version_code DESC LIMIT 1"
    );
    if (result.rows.length === 0 || !result.rows[0].apk_url) {
      return res.status(404).send('Nenhum APK disponivel');
    }
    res.redirect(302, result.rows[0].apk_url);
  } catch (e) {
    res.status(500).send('Erro interno');
  }
});

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;

init()
  .then(() => app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`)))
  .catch(err => { console.error('Erro ao iniciar banco:', err); process.exit(1); });
