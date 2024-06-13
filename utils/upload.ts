import multer from 'multer';
import fs from 'fs';
import { toSafeFileName } from './toSafeFileName';

const UPLOAD_DIR = process.env.UPLOAD_DIR;
const PUBLIC_DIR = process.env.PUBLIC_DIR;

const multerConfig = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const { id, collectionName } = req.params;
      const PATH = `${PUBLIC_DIR}/${UPLOAD_DIR}/${collectionName}/${id}`;
      if (!fs.existsSync(PATH)) {
        fs.mkdirSync(PATH, { recursive: true });
      }
      cb(null, PATH);
    },
    filename: (req, file, cb) => {
      const safeFileName = toSafeFileName(file.originalname);
      cb(null, safeFileName);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype == 'image/png' || file.mimetype == 'image/jpg' || file.mimetype == 'image/jpeg' || file.mimetype == 'image/webp') {
      cb(null, true);
    } else {
      cb(null, false);
      const err = new Error('Only .png, .jpg, .jpeg and webp format allowed!');
      err.name = 'ExtensionError';
      return cb(err);
    }
  },
});

const uploadMultiple = multerConfig.array('files', 10);
const uploadSingle = multerConfig.single('file');
export { uploadMultiple, uploadSingle };
