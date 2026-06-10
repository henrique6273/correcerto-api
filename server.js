const express = require('express');
const cors = require('cors');
const { init } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/ganhos', require('./routes/ganhos'));
app.use('/despesas', require('./routes/despesas'));
app.use('/meta', require('./routes/meta'));

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;

init()
  .then(() => app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`)))
  .catch(err => { console.error('Erro ao iniciar banco:', err); process.exit(1); });
