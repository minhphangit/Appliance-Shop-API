const multer = require('multer');
const path = require('path');
// Cấu hình lưu trữ tạm thời cho file
const storage = multer.diskStorage({
  filename: function (req: any, file: any, cb: any) {
    cb(null, file.originalname);
  },
});

// Kiểm tra loại file và kích thước
const fileFilter = (req: any, file: any, cb: any) => {
  const filetypes = /jpeg|jpg|png|gif|mp4/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Loại file không hợp lệ'));
  }
};

export const uploadCloud = multer({
  storage: storage,
  // fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
