import React, { useState } from 'react';
import { Button, Card, Form, ProgressBar, Alert } from 'react-bootstrap';
import { FileService } from '../services/fileService';
import { UploadProgress } from '../types';
import { config } from '../config';

const fileService = new FileService();

const FileUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [chunkSize, setChunkSize] = useState<number>(config.upload.chunkSize);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // 新しいファイルが選択されたら進捗をリセット
      setProgress(null);
    }
  };

  const handleChunkSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value, 10) * 1024 * 1024; // MBからバイトに変換
    setChunkSize(size);
    // 設定を更新
    config.upload.chunkSize = size;
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      await fileService.uploadFile(file, (uploadProgress) => {
        setProgress(uploadProgress);
      });
    } catch (error) {
      console.error('アップロード失敗:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="mt-3">
      <Card.Header>ファイルアップローダー</Card.Header>
      <Card.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>ファイルを選択</Form.Label>
            <Form.Control
              type="file"
              onChange={handleFileChange}
              disabled={progress?.status === 'uploading'}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>チャンクサイズ (MB)</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="100"
              value={chunkSize / (1024 * 1024)}
              onChange={handleChunkSizeChange}
              disabled={progress?.status === 'uploading'}
            />
            <Form.Text className="text-muted">
              ファイルはこのサイズ (MB) のチャンクに分割されます。
            </Form.Text>
          </Form.Group>

          {file && (
            <div className="mb-3">
              <strong>選択されたファイル: </strong>
              {file.name} ({formatBytes(file.size)})
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!file || progress?.status === 'uploading'}
          >
            アップロード
          </Button>
        </Form>

        {progress && (
          <div className="mt-4">
            <h5>アップロード進捗</h5>
            <ProgressBar
              now={progress.progress}
              label={`${progress.progress}%`}
              variant={progress.status === 'error' ? 'danger' : 'success'}
            />
            <div className="mt-2">
              <strong>ステータス: </strong>
              {progress.status === 'uploading' && 'アップロード中...'}
              {progress.status === 'completed' && 'アップロード完了!'}
              {progress.status === 'error' && 'アップロード失敗!'}
              {progress.status === 'preparing' && '準備中...'}
            </div>
            <div>
              <strong>アップロード済み: </strong>
              {formatBytes(progress.uploadedSize)} / {formatBytes(progress.totalSize)}
            </div>
            {progress.message && (
              <Alert variant="info" className="mt-2">
                {progress.message}
              </Alert>
            )}
            {progress.error && (
              <Alert variant="danger" className="mt-2">
                エラー: {progress.error}
              </Alert>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default FileUploader;