export const config = {
    api: {
      baseUrl: 'http://localhost:3001/api',
    },
    upload: {
      chunkSize: 1024 * 1024, // デフォルトで1MBチャンク
      maxRetries: 5,
      initialBackoff: 1000, // 1秒
      maxBackoff: 30000, // 30秒
    },
  };