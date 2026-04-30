const postgres = require('../config/postgres');

const User = {
    findOne: async (criteria) => {
        let query = 'SELECT * FROM users';
        let params = [];
        if (criteria.email) {
            query += ' WHERE email = $1';
            params.push(criteria.email);
        } else if (criteria.microsoftId) {
            query += ' WHERE microsoft_id = $1';
            params.push(criteria.microsoftId);
        } else if (criteria.portalUserId) {
            query += ' WHERE portal_user_id = $1';
            params.push(criteria.portalUserId);
        }
        const res = await postgres.query(query, params);
        return res.rows[0];
    },
    // Add other methods as needed for the Meeting system...
};

module.exports = User;

