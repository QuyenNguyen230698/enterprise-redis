const express = require("express");
const corsConfig = require("./config/corsConfig.js");
require("dotenv").config();
const config = require("./config/index");
const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const Queue = require("bull");
const basicAuth = require("express-basic-auth");
const moment = require("moment");
const prometheus = require("prom-client");
const winston = require("winston");
const rateLimit = require("express-rate-limit");
const postgres = require("./config/postgres");
require("./cronJob/meetingWorker"); // Kích hoạt Worker quét Postgres



// Hàm tạo hàng đợi với cấu hình Redis và các tùy chọn nâng cao
// Setup Winston Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Setup Prometheus metrics
const metrics = {
  jobsProcessed: new prometheus.Counter({
    name: "bull_jobs_processed_total",
    help: "Total number of processed jobs",
    labelNames: ["queue", "status"],
  }),
  jobDuration: new prometheus.Histogram({
    name: "bull_job_duration_seconds",
    help: "Job processing duration",
    labelNames: ["queue"],
  }),
  queueSize: new prometheus.Gauge({
    name: "bull_queue_size",
    help: "Current size of the queue",
    labelNames: ["queue", "status"],
  }),
};

const { createQueue } = require("./config/queue");
const app = express();
app.use(corsConfig);

// Import and apply rate limiter from config
const rateLimiter = require("./config/rateLimiter.js");
app.use(rateLimiter);

// Basic Auth Middleware
const authMiddleware = basicAuth({
  users: { "admin-enterprise": process.env.BULL_BOARD_PASSWORD },
  challenge: true,
});
// Prometheus metrics endpoint
app.get("/metrics", authMiddleware, async (req, res) => {
  res.set("Content-Type", prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});

const meetingTaskQueue = require("./cronJob/meetingWorker"); // Import the queue exported from meetingWorker

// Khởi tạo các queue
const inviteQueue = createQueue("invite");

// Advanced Queue Management Functions
async function getQueueStats(queue) {
  const [jobCounts, completedJobs, failedJobs, delayedJobs, activeJobs] =
    await Promise.all([
      queue.getJobCounts(),
      queue.getJobs(["completed"], 0, 100),
      queue.getJobs(["failed"], 0, 100),
      queue.getJobs(["delayed"], 0, 100),
      queue.getJobs(["active"], 0, 100),
    ]);

  return {
    counts: jobCounts,
    recentJobs: {
      completed: completedJobs.map((job) => ({
        id: job.id,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        data: job.data,
        returnvalue: job.returnvalue,
      })),
      failed: failedJobs,
      delayed: delayedJobs,
      active: activeJobs,
    },
    performance: {
      averageProcessingTime:
        completedJobs.reduce(
          (acc, job) => acc + (job.finishedOn - job.processedOn),
          0,
        ) / (completedJobs.length || 1),
    },
  };
}

async function cleanupOldJobs(queue) {
  const olderThan = moment().subtract(7, "days").toDate();
  await queue.clean(0, "completed", 1000, olderThan);
  await queue.clean(0, "failed", 1000, olderThan);
}

// Schedule periodic cleanup
setInterval(
  () => {
    cleanupOldJobs(inviteQueue).catch((err) =>
      logger.error("Cleanup error:", err),
    );
    cleanupOldJobs(meetingTaskQueue).catch((err) =>
      logger.error("Cleanup error:", err),
    );
  },
  24 * 60 * 60 * 1000,
); // Run daily

// Tạo Bull Board với ExpressAdapter
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [
    new BullAdapter(inviteQueue, {
      readOnlyMode: false,
      allowRetries: true,
      description: "Queue for processing invite meeting (v1)",
    }),
    new BullAdapter(meetingTaskQueue, {
      readOnlyMode: false,
      allowRetries: true,
      description: "Main Meeting Background Tasks (Postgres Sync)",
    }),
  ],
  serverAdapter: serverAdapter,
  options: {
    uiConfig: {
      boardTitle: "",
      boardLogo: {
        path: "https://lh3.googleusercontent.com/a/ACg8ocLoLcUhHu7f4f9k2l4rlQJAK3P7XQ-SB4Um73a64Odk4e3mSA=s400-c",
        width: "128px",
        height: "40px",
      },
      miscLinks: [
        { text: "Documentation", url: "/docs" },
        { text: "Metrics", url: "/metrics" },
      ],
      favIcon: {
        default: "https://lh3.googleusercontent.com/a/ACg8ocLoLcUhHu7f4f9k2l4rlQJAK3P7XQ-SB4Um73a64Odk4e3mSA=s400-c",
        alternative: "https://lh3.googleusercontent.com/a/ACg8ocLoLcUhHu7f4f9k2l4rlQJAK3P7XQ-SB4Um73a64Odk4e3mSA=s400-c",
      },
      font: {
        family:
          "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif",
        size: "14px",
        weight: "normal",
      },
    },
    queueBasePath: "/queues",
    redisRefreshRate: 5000,
    hideLocalData: false,
  },
});

// Apply auth middleware to Bull Board routes
app.use("/admin/queues", authMiddleware, serverAdapter.getRouter());

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const dbCheck = await postgres.query('SELECT NOW()');
    res.json({ 
      status: "healthy", 
      postgres: "connected",
      dbTime: dbCheck.rows[0].now,
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    res.json({ 
      status: "degraded", 
      postgres: "error",
      message: err.message,
      timestamp: new Date().toISOString() 
    });
  }
});

module.exports = app;
