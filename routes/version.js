const router = require('express').Router();
const { pool } = require('../db');

router.get('/latest', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT version_name, version_code, apk_url, release_notes, force_update FROM app_versions ORDER BY version_code DESC LIMIT 1'
    );
    if (result.rows.length === 0) {
      return res.json({ version_name: '1.0.0', version_code: 1, apk_url: '', release_notes: '', force_update: false });
    }
    const row = result.rows[0];
    res.json({
      version_name: row.version_name,
      version_code: row.version_code,
      apk_url: row.apk_url,
      release_notes: row.release_notes,
      force_update: row.force_update
    });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Atualizar versão (protegido por API key via header X-Admin-Key)
router.post('/update', async (req, res) => {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || req.headers['x-admin-key'] !== adminKey) {
    return res.status(401).json({ erro: 'Não autorizado' });
  }
  const { version_name, version_code, apk_url, release_notes, force_update } = req.body;
  if (!version_name || !version_code || !apk_url) {
    return res.status(400).json({ erro: 'version_name, version_code e apk_url são obrigatórios' });
  }
  try {
    await pool.query(
      'INSERT INTO app_versions (version_name, version_code, apk_url, release_notes, force_update) VALUES ($1, $2, $3, $4, $5)',
      [version_name, version_code, apk_url, release_notes || '', force_update || false]
    );
    res.json({ ok: true, version_name, version_code });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

module.exports = router;
