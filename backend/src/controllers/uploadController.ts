import { Request, Response } from 'express';
import { FileService } from '../services/fileService';
import { FileChunk } from '../types';

const fileService = new FileService();

export class UploadController {
  async uploadChunk(req: Request, res: Response): Promise<void> {
    try {
      const { originalFilename, chunkIndex, totalChunks } = req.body;
      
      if (!originalFilename || chunkIndex === undefined || !totalChunks) {
        res.status(400).json({ success: false, error: '必須フィールドが不足しています' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, error: 'ファイルがアップロードされていません' });
        return;
      }

      const fileChunk: FileChunk = {
        originalFilename,
        chunkIndex: parseInt(chunkIndex, 10),
        totalChunks: parseInt(totalChunks, 10),
        chunk: req.file.buffer,
      };

      const result = await fileService.processChunk(fileChunk);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        // サーバーエラーの場合はリトライをトリガーするために500ステータスを送信
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('アップロードコントローラーエラー:', error);
      res.status(500).json({ success: false, error: `サーバーエラー: ${error instanceof Error ? error.message : String(error)}` });
    }
  }
}