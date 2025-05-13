export default {
    server: {
      port: 3001,
    },
    upload: {
      tempDir: './temp',
      finalDir: './uploads',
    },
    api: {
      errorRate: 0.3, // テスト用：30%の確率でエラー発生
    },
  };