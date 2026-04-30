const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../private/upload')); // Thay đổi đường dẫn
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex'); // Sử dụng 8 byte để tạo uniqueSuffix ngắn hơn
    const extension = path.extname(file.originalname); // Lấy đuôi file
    cb(null, `${uniqueSuffix}${extension}`); // Sử dụng uniqueSuffix và giữ đuôi file
  }
});

const upload = multer({ storage });

const contestStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../private/contest/project')); // Đường dẫn mới cho contest
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname);
    cb(null, `projects-${uniqueSuffix}${extension}`);
  }
});

const uploadContest = multer({ 
  storage: contestStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // Giới hạn kích thước file là 50MB
});

const contestAvatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../private/contest/avatar')); // Đường dẫn mới cho avatar của contest
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${extension}`);
  }
});

const uploadContestAvatar = multer({ storage: contestAvatarStorage });

module.exports = { upload, uploadContest, uploadContestAvatar };