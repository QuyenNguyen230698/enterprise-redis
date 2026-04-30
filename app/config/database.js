const postgres = require('./postgres');

const connectDB = async () => {
    try {
        const res = await postgres.query('SELECT NOW()');
        console.log('PostgreSQL connected successfully via config/database at:', res.rows[0].now);
    } catch (error) {
        console.error('PostgreSQL connection error via config/database:', error);
        process.exit(1); 
    }
};

module.exports = connectDB;

