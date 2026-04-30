const Queue = require('bull');
const config = require('./index');

function createQueue(name) {
    return new Queue(name, {
        redis: {
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            tls: config.redis.tls,
        },
        defaultJobOptions: {
            // Retry only on 5xx / network errors; idempotency is enforced by DB status=sent
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            // Keep completed jobs long enough for the next cron tick to see them via getJob()
            // so it skips re-enqueue. 5 minutes covers one full cron cycle safely.
            removeOnComplete: {
                age: 5 * 60,
                count: 500,
            },
            removeOnFail: {
                age: 24 * 3600,
                count: 1000,
            },
            timeout: 30000,
        }
    });
}

module.exports = { createQueue };
