import axios from 'axios';
import { config } from '../config';

const api = axios.create({
  baseURL: config.api.baseUrl,
});

export const uploadChunk = async (
  originalFilename: string,
  chunkIndex: number,
  totalChunks: number,
  chunkBlob: Blob
): Promise<any> => {
  const formData = new FormData();
  formData.append('originalFilename', originalFilename);
  formData.append('chunkIndex', chunkIndex.toString());
  formData.append('totalChunks', totalChunks.toString());
  formData.append('chunk', chunkBlob);

  const response = await api.post('/upload/chunk', formData);
  return response.data;
};