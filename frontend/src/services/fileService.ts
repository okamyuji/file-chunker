import { config } from '../config';
import { FileChunk, UploadProgress } from '../types';
import { uploadChunk } from './apiService';

export class FileService {
  private chunkSize: number;
  private maxRetries: number;
  private initialBackoff: number;
  private maxBackoff: number;

  constructor() {
    this.chunkSize = config.upload.chunkSize;
    this.maxRetries = config.upload.maxRetries;
    this.initialBackoff = config.upload.initialBackoff;
    this.maxBackoff = config.upload.maxBackoff;
  }

  async uploadFile(
    file: File,
    onProgress: (progress: UploadProgress) => void
  ): Promise<void> {
    const chunks = this.splitFileIntoChunks(file);
    const totalChunks = chunks.length;
    
    // 進捗オブジェクトの作成
    const progress: UploadProgress = {
      filename: file.name,
      totalSize: file.size,
      uploadedSize: 0,
      progress: 0,
      status: 'preparing',
    };
    
    onProgress({ ...progress });
    
    progress.status = 'uploading';
    onProgress({ ...progress });
    
    // リトライロジックを使用してチャンクをアップロード
    const uploadPromises = chunks.map(chunk => this.uploadChunkWithRetry(
      file.name,
      chunk.index,
      totalChunks,
      chunk.chunkBlob,
      (success: boolean) => {
        if (success) {
          progress.uploadedSize += chunk.chunkBlob.size;
          progress.progress = Math.round((progress.uploadedSize / progress.totalSize) * 100);
          onProgress({ ...progress });
        }
      }
    ));
    
    try {
      await Promise.all(uploadPromises);
      progress.status = 'completed';
      progress.progress = 100;
      onProgress({ ...progress });
    } catch (error) {
      progress.status = 'error';
      progress.error = error instanceof Error ? error.message : String(error);
      onProgress({ ...progress });
      throw error;
    }
  }

  private splitFileIntoChunks(file: File): FileChunk[] {
    const chunks: FileChunk[] = [];
    const totalChunks = Math.ceil(file.size / this.chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, file.size);
      const chunkBlob = file.slice(start, end);
      
      chunks.push({
        file,
        index: i,
        totalChunks,
        chunkBlob,
        status: 'pending',
        retries: 0,
      });
    }
    
    return chunks;
  }

  private async uploadChunkWithRetry(
    filename: string,
    chunkIndex: number,
    totalChunks: number,
    chunkBlob: Blob,
    onSuccess: (success: boolean) => void
  ): Promise<void> {
    let retries = 0;
    let backoff = this.initialBackoff;
    
    while (retries <= this.maxRetries) {
      try {
        await uploadChunk(filename, chunkIndex, totalChunks, chunkBlob);
        onSuccess(true);
        return;
      } catch (error) {
        retries++;
        
        if (retries > this.maxRetries) {
          throw new Error(`${this.maxRetries}回のリトライ後もチャンク${chunkIndex}のアップロードに失敗しました。`);
        }
        
        // 指数バックオフを計算
        const jitter = 0.1 * backoff * Math.random();
        const actualBackoff = backoff + jitter;
        backoff = Math.min(backoff * 2, this.maxBackoff);
        
        console.log(`チャンク${chunkIndex}の${retries}/${this.maxRetries}回目のリトライを${actualBackoff}ms後に実行します。`);
        
        // バックオフ期間を待機
        await new Promise(resolve => setTimeout(resolve, actualBackoff));
      }
    }
  }
}