const cron = require('node-cron');
const postgres = require("../config/postgres");
const { createQueue } = require("../config/queue");

const meetingTaskQueue = createQueue('meeting-tasks');

// Chạy mỗi 1 phút — quét các invite cần gửi hoặc retry
cron.schedule('*/1 * * * *', async () => {
    try {
        // Only fetch invites that still need work: pending, enqueued, processing (stuck), or failed
        const query = `
            SELECT id, email, token, status
            FROM meeting_invites
            WHERE status IN ('pending', 'enqueued', 'processing', 'failed')
            ORDER BY created_at
            LIMIT 50
        `;
        const result = await postgres.query(query);

        const total = result.rows.length;
        if (total === 0) return;

        let newJobs = 0;      // job thực sự mới được Bull chấp nhận
        let skippedBull = 0;  // Bull đang active/waiting — không cần add
        let skippedDup = 0;   // Bull trả null vì jobId đã tồn tại (completed/chờ gc)

        for (const invite of result.rows) {
            const job = await meetingTaskQueue.getJob(invite.id);
            const state = job ? await job.getState() : 'none';

            // Skip nếu Bull đang xử lý hoặc đang đợi — không enqueue lại
            if (state === 'active' || state === 'waiting' || state === 'delayed') {
                skippedBull++;
                continue;
            }

            // Job failed/completed còn trong Redis sẽ block add() với cùng jobId
            // Phải remove trước để Bull tạo job mới
            if (job && (state === 'failed' || state === 'completed')) {
                await job.remove();
            }

            const addedJob = await meetingTaskQueue.add(
                {
                    type: 'SEND_INVITE',
                    invite_id: invite.id,
                    email: invite.email,
                    token: invite.token,
                },
                { jobId: invite.id }
            );

            if (addedJob) {
                newJobs++;
                if (invite.status === 'pending') {
                    await postgres.query(
                        'UPDATE meeting_invites SET status = $1 WHERE id = $2',
                        ['enqueued', invite.id]
                    );
                }
            } else {
                skippedDup++;
            }
        }

        console.log(
            `[CRON] Quét PostgreSQL: tìm ${total} | mới enqueue: ${newJobs} | bỏ qua (Bull active/waiting): ${skippedBull} | bỏ qua (jobId trùng): ${skippedDup}`
        );
    } catch (error) {
        console.error("[CRON ERROR] Lỗi khi quét PostgreSQL:", error);
    }
});

// Worker: gọi Python API để gửi email
meetingTaskQueue.process(async (job) => {
    const { invite_id, email } = job.data;

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(
        `${backendUrl}/api/v1/meetings/internal/send-invite/${invite_id}`,
        {
            method: 'POST',
            headers: {
                'X-Internal-Secret': process.env.INTERNAL_SECRET || '',
            },
        }
    );

    if (response.status === 404) {
        return { success: false, reason: 'not_found' };
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Python service ${response.status}: ${errorText}`);
    }

    return { success: true };
});

module.exports = meetingTaskQueue;
