const cron = require('node-cron');

// Chạy mỗi ngày lúc 02:00 sáng — quét meeting đã kết thúc còn link Zoom sống
cron.schedule('0 2 * * *', async () => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const secret = process.env.INTERNAL_SECRET || '';

    try {
        const response = await fetch(
            `${backendUrl}/api/v1/meetings/internal/cleanup-zoom-meetings`,
            {
                method: 'POST',
                headers: {
                    'X-Internal-Secret': secret,
                },
            }
        );

        if (!response.ok) {
            const text = await response.text();
            console.error(`[ZoomCleanup] Backend trả lỗi ${response.status}: ${text}`);
            return;
        }

        const result = await response.json();
        console.log(`[ZoomCleanup] Hoàn tất: đã dọn ${result.cleaned} link Zoom, thất bại ${result.failed}`);
    } catch (err) {
        console.error('[ZoomCleanup] Lỗi kết nối tới backend:', err.message);
    }
});

console.log('[ZoomCleanup] Cron job đã đăng ký — chạy mỗi ngày lúc 02:00');
