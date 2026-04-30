const postgres = require('../config/postgres');

const EmailLog = {
    find: async (criteria) => {
        // Simple mapping for status != 'success'
        if (criteria && criteria.status && criteria.status.$ne === 'success') {
            const res = await postgres.query("SELECT * FROM email_logs WHERE status != 'success' ORDER BY created_at DESC");
            return res.rows;
        }
        const res = await postgres.query("SELECT * FROM email_logs ORDER BY created_at DESC");
        return res.rows;
    },

    updateOne: async (criteria, update) => {
        const id = criteria._id;
        const { status, detail } = update.$set;
        const res = await postgres.query(
            "UPDATE email_logs SET status = $1, detail = $2 WHERE id = $3",
            [status, detail, id]
        );
        return res;
    }
};

module.exports = EmailLog;