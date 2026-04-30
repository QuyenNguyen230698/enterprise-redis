
const Summit = require("../models/summitNight");
const config = require("../config/index");
const Redis = require("ioredis");

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
});

let currentContestIndex = 0;

module.exports = (io) => {
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    socket.on("requestSummitDataByDate", async (dateJoin) => {
      try {
        // Lọc dữ liệu theo dateJoin
        const query = { dateJoin };

        const data = await Summit.find(query).select(
          "-QRcode -email -phone"
        );

        // Gửi dữ liệu đã lọc về client
        socket.emit("summitData", data);
      } catch (error) {
        console.error("Error fetching summit data:", error);
      }
    });
   
    socket.on("disconnect", () => {
      onlineUsers.forEach((value, key) => {
        if (value === socket.id) {
          onlineUsers.delete(key);
          console.log(`User ${key} is offline`);

          // Xóa trạng thái online khỏi Redis
          redis.del(`user:${key}:online`, async (err) => {
            if (err) {
              console.error("Error deleting user online status in Redis:", err);
            } else {
              const allUsers = await findUsers();
              const usersWithStatus = allUsers.map((user) => {
                const isUserOnline = onlineUsers.has(user._id.toString());
                return { ...user.toObject(), isOnline: isUserOnline };
              });
              io.emit("userStatusChanged", {
                userId: key,
                isOnline: false,
                usersWithStatus,
              });
            }
          });
        }
      });
    });
  });
};
