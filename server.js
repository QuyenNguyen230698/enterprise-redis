const app = require('./app/index');

require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Logic worker startup
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Bull Board is available at http://localhost:${PORT}/admin/queues`);
});