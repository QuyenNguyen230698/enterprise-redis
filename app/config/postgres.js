const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'admin',
    host: process.env.POSTGRES_SERVER || 'localhost',
    database: process.env.POSTGRES_DB || 'meeting_db',
    password: process.env.POSTGRES_PASSWORD || 'Quyen20262027',
    port: process.env.POSTGRES_PORT || 5432,
});

pool.on('error', (err) => {
    console.error('[PostgreSQL] Idle client error — sẽ tự kết nối lại:', err.message);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
