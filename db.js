const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      email TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      is_premium BOOLEAN DEFAULT FALSE,
      criado_em BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    );

    CREATE TABLE IF NOT EXISTS ganhos (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL REFERENCES usuarios(email) ON DELETE CASCADE,
      valor DOUBLE PRECISION NOT NULL,
      plataforma TEXT NOT NULL,
      data DATE NOT NULL,
      descricao TEXT DEFAULT '',
      criado_em BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    );
    ALTER TABLE ganhos ADD COLUMN IF NOT EXISTS corridas INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS premium_expiracao BIGINT DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_ganhos_email ON ganhos(user_email);
    CREATE INDEX IF NOT EXISTS idx_ganhos_data ON ganhos(data);

    CREATE TABLE IF NOT EXISTS despesas (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL REFERENCES usuarios(email) ON DELETE CASCADE,
      valor DOUBLE PRECISION NOT NULL,
      categoria TEXT NOT NULL,
      plataforma TEXT NOT NULL DEFAULT 'Geral',
      data DATE NOT NULL,
      descricao TEXT DEFAULT '',
      criado_em BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    );
    ALTER TABLE despesas ADD COLUMN IF NOT EXISTS plataforma TEXT NOT NULL DEFAULT 'Geral';
    CREATE INDEX IF NOT EXISTS idx_despesas_email ON despesas(user_email);
    CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas(data);
    CREATE INDEX IF NOT EXISTS idx_despesas_plataforma ON despesas(plataforma);

    CREATE TABLE IF NOT EXISTS metas (
      user_email TEXT PRIMARY KEY REFERENCES usuarios(email) ON DELETE CASCADE,
      valor_diario DOUBLE PRECISION NOT NULL DEFAULT 200,
      atualizado_em BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    );

    CREATE TABLE IF NOT EXISTS app_versions (
      id SERIAL PRIMARY KEY,
      version_name TEXT NOT NULL,
      version_code INTEGER NOT NULL,
      apk_url TEXT NOT NULL DEFAULT '',
      release_notes TEXT DEFAULT '',
      force_update BOOLEAN DEFAULT FALSE,
      created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
    );

    INSERT INTO app_versions (version_name, version_code, apk_url, release_notes, force_update)
    SELECT '1.0.0', 1, '', 'Versão inicial do Corre Certo.', false
    WHERE NOT EXISTS (SELECT 1 FROM app_versions);
  `);
}

module.exports = { pool, init };
