import fs from 'fs';
import path from 'path';
import config from '../config/default';
import { FileChunk, UploadResult } from '../types';

export class FileService {
  private tempDir: string;
  private finalDir: string;
  private errorRate: number;
  private static combining: Set<string> = new Set();

  constructor() {
    this.tempDir = config.upload.tempDir;
    this.finalDir = config.upload.finalDir;
    this.errorRate = config.api.errorRate;

    // ディレクトリが存在することを確認
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    if (!fs.existsSync(this.finalDir)) {
      fs.mkdirSync(this.finalDir, { recursive: true });
    }
  }

  async processChunk(fileChunk: FileChunk): Promise<UploadResult> {
    // ランダムエラーのシミュレーション
    if (Math.random() < this.errorRate) {
      return {
        success: false,
        error: 'ランダムサーバーエラー',
      };
    }

    try {
      const chunkFilename = `${fileChunk.originalFilename}.part${fileChunk.chunkIndex}`;
      const chunkPath = path.join(this.tempDir, chunkFilename);

      // チャンクを一時ディレクトリに保存
      fs.writeFileSync(chunkPath, fileChunk.chunk);

      // すべてのチャンクがアップロードされたかチェック
      if (this.checkAllChunksUploaded(fileChunk.originalFilename, fileChunk.totalChunks)) {
        // すでに結合中なら何もしない
        if (FileService.combining.has(fileChunk.originalFilename)) {
          return {
            success: true,
            message: '結合処理中です',
            filename: fileChunk.originalFilename,
          };
        }
        FileService.combining.add(fileChunk.originalFilename);
        try {
          await this.combineChunks(fileChunk.originalFilename, fileChunk.totalChunks);
        } finally {
          FileService.combining.delete(fileChunk.originalFilename);
        }
        return {
          success: true,
          message: 'ファイルアップロードが完了し、結合されました',
          filename: fileChunk.originalFilename,
        };
      }

      return {
        success: true,
        message: `チャンク ${fileChunk.chunkIndex + 1} / ${fileChunk.totalChunks} がアップロードされました`,
      };
    } catch (error) {
      console.error('チャンク処理エラー:', error);
      return {
        success: false,
        error: `サーバーエラー: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private checkAllChunksUploaded(filename: string, totalChunks: number): boolean {
    let uploadedChunks = 0;
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(this.tempDir, `${filename}.part${i}`);
      if (fs.existsSync(chunkPath)) {
        uploadedChunks++;
      }
    }

    return uploadedChunks === totalChunks;
  }

  private async combineChunks(filename: string, totalChunks: number): Promise<string> {
    const outputPath = path.join(this.finalDir, filename);
    const writeStream = fs.createWriteStream(outputPath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(this.tempDir, `${filename}.part${i}`);
      const chunkBuffer = fs.readFileSync(chunkPath);
      writeStream.write(chunkBuffer);
      
      // 結合後、チャンクファイルを削除
      fs.unlinkSync(chunkPath);
    }

    writeStream.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  }
}