const User = require('../../models/userModel');

// Hàm để tìm người dùng theo email
const findUserByEmail = async (email) => {
    try {
        const user = await User.findOne({ email });
        return user;
    } catch (error) {
        throw new Error('Error finding user: ' + error.message);
    }
};

// Hàm để tìm tất cả người dùng
const findUsers = async () => {
    try {
        const users = await User.find({position:"Judges"});
        return users;
    } catch (error) {
        throw new Error('Error fetching users: ' + error.message);
    }
};

module.exports = {
    findUserByEmail,
    findUsers,
};