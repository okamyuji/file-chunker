export interface FileChunk {
    file: File;
    index: number;
    totalChunks: number;
    chunkBlob: Blob;
    status: 'pending' | 'uploading' | 'success' | 'error';
    retries: number;
  }
  
  export interface UploadProgress {
    filename: string;
    totalSize: number;
    uploadedSize: number;
    progress: number;
    status: 'idle' | 'preparing' | 'uploading' | 'completed' | 'error';
    message?: string;
    error?: string;
  }