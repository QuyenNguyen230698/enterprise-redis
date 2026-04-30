const cron = require('node-cron');
const { dynamicEmailWithTemplate } = require("../services/emailService");
const EmailLog = require("../models/emailLog");
const Queue = require('bull');
const config = require("../config/index");

// Tạo một hàng đợi mới với URI Redis
const cronJobTaskQueue = new Queue('cronJobTask', {
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
    },
});

// Kiểm tra kết nối Redis
cronJobTaskQueue.on("error", (error) => {
    console.error("Redis connection error:", error);
});

// Tạo cron job chạy mỗi 15 phút '*/15 * * * *'
cron.schedule('* * * * *', async() => {
    try {

        const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
        console.log('time::::', twentyMinutesAgo)
        const failedEmails = await EmailLog.find({
            status: { $ne: "success" }, // Chỉ chọn email chưa thành công
        });
        console.log(`Found ${failedEmails} failed emails.`);
        console.log(`Found ${failedEmails.length} failed emails.`);

        // Chỉ thêm email vào hàng đợi nếu có email lỗi
        if (failedEmails.length > 0) {
            for (const emailLog of failedEmails) {
                console.log(`Adding email with ID ${emailLog._id} to queue.`);
                await cronJobTaskQueue.add(emailLog);
            }
        } else {
            console.log("No failed emails found. Skipping queue addition.");
        }
    } catch (error) {
        console.error("Error in cron job:", error);
    }
});

// Xử lý công việc trong hàng đợi
cronJobTaskQueue.process(50, async(job) => {
    const {
        to = '',
            subject = '',
            templateName = '',
            templateData = '',
            campaign = '',
            attachments = ''
    } = job.data;

    // Thêm log để kiểm tra dữ liệu
    console.log("Job data:", job.data);

    let attempts = 0;
    const maxAttempts = 3;
    let emailResult;

    console.log(`Processing email to ${to} with job ID ${job.id}.`);

    while (attempts < maxAttempts) {
        try {
            emailResult = await dynamicEmailWithTemplate(
                to,
                subject,
                templateName,
                templateData,
                campaign,
                attachments,
                job.data
            );
        } catch (error) {
            console.error("Error sending email:", error);
            attempts++;
            continue;
        }

        if (emailResult.result) {
            console.log(`Email to ${to} sent successfully on attempt ${attempts + 1}.`);
            await EmailLog.updateOne({ _id: job.data._id }, {
                $set: {
                    status: "success",
                    detail: JSON.stringify(emailResult.log),
                },
            });
            return;
        } else {
            attempts++;
            console.error(`Attempt ${attempts} failed for email to ${to}:`, emailResult.error);
        }
    }

    if (!emailResult.result) {
        console.error(`Failed to send email to ${to} after ${maxAttempts} attempts.`);
        await EmailLog.updateOne({ _id: job.data._id }, {
            $set: {
                status: "failure",
                detail: JSON.stringify(emailResult.log),
            },
        });
    }
});
cronJobTaskQueue.on('completed', async(job) => {
    if (job.id % 50 === 0) {
        console.log('Waiting for 30 seconds after processing 50 tasks...');
        await new Promise(resolve => setTimeout(resolve, 30000));
    }
});