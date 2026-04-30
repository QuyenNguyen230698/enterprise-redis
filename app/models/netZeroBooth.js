const postgres = require('../config/postgres');

// PostgreSQL Stub for legacy model
const ModelStub = {
    find: async () => [],
    findOne: async () => null,
    updateOne: async () => ({ nModified: 0 }),
    save: async (data) => data,
};

module.exports = ModelStub;
