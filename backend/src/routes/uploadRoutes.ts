import express from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/uploadController';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
const uploadController = new UploadController();

router.post('/chunk', upload.single('chunk'), (req, res) => uploadController.uploadChunk(req, res));

export default router;