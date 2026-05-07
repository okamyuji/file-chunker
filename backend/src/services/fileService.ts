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
      const safeName = FileService.assertSafeFilename(fileChunk.originalFilename);
      const chunkFilename = `${safeName}.part${fileChunk.chunkIndex}`;
      const chunkPath = this.safeJoin(this.tempDir, chunkFilename);

      // チャンクを一時ディレクトリに保存
      fs.writeFileSync(chunkPath, fileChunk.chunk);

      // すべてのチャンクがアップロードされたかチェック
      if (this.checkAllChunksUploaded(safeName, fileChunk.totalChunks)) {
        // すでに結合中なら何もしない
        if (FileService.combining.has(safeName)) {
          return {
            success: true,
            message: '結合処理中です',
            filename: safeName,
          };
        }
        FileService.combining.add(safeName);
        try {
          await this.combineChunks(safeName, fileChunk.totalChunks);
        } finally {
          FileService.combining.delete(safeName);
        }
        return {
          success: true,
          message: 'ファイルアップロードが完了し、結合されました',
          filename: safeName,
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
    const safeName = FileService.assertSafeFilename(filename);
    let uploadedChunks = 0;

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = this.safeJoin(this.tempDir, `${safeName}.part${i}`);
      if (fs.existsSync(chunkPath)) {
        uploadedChunks++;
      }
    }

    return uploadedChunks === totalChunks;
  }

  private async combineChunks(filename: string, totalChunks: number): Promise<string> {
    const safeName = FileService.assertSafeFilename(filename);
    const outputPath = this.safeJoin(this.finalDir, safeName);
    const writeStream = fs.createWriteStream(outputPath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = this.safeJoin(this.tempDir, `${safeName}.part${i}`);
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

  // Reject filenames that could escape the upload directory. Path separators,
  // null bytes, and traversal segments are not legitimate filename characters
  // for this service.
  private static assertSafeFilename(name: string): string {
    if (
      typeof name !== 'string' ||
      name.length === 0 ||
      name === '.' ||
      name === '..' ||
      name.includes('/') ||
      name.includes('\\') ||
      name.includes('\0') ||
      name !== path.basename(name)
    ) {
      throw new Error(`Invalid filename: ${String(name)}`);
    }
    return name;
  }

  private safeJoin(base: string, safeName: string): string {
    const baseResolved = path.resolve(base);
    const resolved = path.resolve(baseResolved, safeName);
    if (resolved !== baseResolved && !resolved.startsWith(baseResolved + path.sep)) {
      throw new Error(`Path traversal detected for: ${safeName}`);
    }
    return resolved;
  }
}