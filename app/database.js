const postgres = require('./config/postgres');

const connectDB = async () => {
    try {
        const res = await postgres.query('SELECT NOW()');
        console.log('PostgreSQL connected successfully at:', res.rows[0].now);
    } catch (error) {
        console.error('PostgreSQL connection error:', error);
        process.exit(1); 
    }
};

module.exports = connectDB;