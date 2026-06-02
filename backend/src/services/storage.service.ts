/**
 * Storage facade — delegates to the active StorageProvider.
 * @see src/services/storage/index.ts
 */
export {
  deleteFile,
  getStorageProvider,
  setStorageProvider,
  uploadImageFromBase64,
  uploadVideoFromUrl,
} from '@/services/storage/index';

export type { StorageProvider, UploadedMedia } from '@/services/storage/types';
