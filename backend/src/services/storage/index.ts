import { CloudinaryStorageProvider } from './cloudinary.provider';
import { S3CompatibleStorageProvider } from './s3.provider';
import { LocalFileStorageProvider } from './local.provider';
import { resolveStorageBackend } from './storage.config';
import type { StorageProvider } from './types';

function createProvider(): StorageProvider {
  switch (resolveStorageBackend()) {
    case 'cloudinary':
      return new CloudinaryStorageProvider();
    case 's3':
      return new S3CompatibleStorageProvider();
    default:
      return new LocalFileStorageProvider();
  }
}

let activeProvider: StorageProvider = createProvider();

/** Replace the active storage backend (e.g. custom R2 provider) at runtime/bootstrap. */
export function setStorageProvider(provider: StorageProvider): void {
  activeProvider = provider;
}

export function getStorageProvider(): StorageProvider {
  return activeProvider;
}

export async function uploadImageFromBase64(
  base64Data: string,
  userId: string,
  generationId: string,
) {
  return activeProvider.uploadImageFromBase64(base64Data, userId, generationId);
}

export async function uploadVideoFromUrl(
  videoUrl: string,
  userId: string,
  generationId: string,
) {
  return activeProvider.uploadVideoFromUrl(videoUrl, userId, generationId);
}

export async function deleteFile(fileUrl: string): Promise<void> {
  return activeProvider.deleteFile(fileUrl);
}

export type { StorageProvider, UploadedMedia } from './types';
