export interface FileChunk {
    originalFilename: string;
    chunkIndex: number;
    totalChunks: number;
    chunk: Buffer;
  }
  
  export interface UploadResult {
    success: boolean;
    error?: string;
    message?: string;
    filename?: string;
  }