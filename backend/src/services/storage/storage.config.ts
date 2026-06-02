import { config } from '@/config';

export type StorageBackend = 'cloudinary' | 's3' | 'local';

export function resolveStorageBackend(): StorageBackend {
  const cloudName = (config.CLOUDINARY_CLOUD_NAME ?? '').trim();
  const cloudKey = (config.CLOUDINARY_API_KEY ?? '').trim();
  const cloudSecret = (config.CLOUDINARY_API_SECRET ?? '').trim();
  if (cloudName && cloudKey && cloudSecret) {
    return 'cloudinary';
  }

  const awsKey = (config.AWS_ACCESS_KEY_ID ?? '').trim().toLowerCase();
  const hasAws = Boolean(awsKey && awsKey !== 'placeholder');
  if (hasAws) {
    return 's3';
  }

  return 'local';
}

export function useLocalFileStorage(): boolean {
  return resolveStorageBackend() === 'local';
}
