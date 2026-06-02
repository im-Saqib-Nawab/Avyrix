import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import axios from 'axios';
import { config } from '@/config';
import { logger } from '@/services/logger.service';
import type { StorageProvider, UploadedMedia } from './types';

export class S3CompatibleStorageProvider implements StorageProvider {
  private readonly client: S3Client;

  private readonly bucket: string;

  constructor() {
    this.bucket = config.AWS_BUCKET_NAME;
    this.client = new S3Client({
      region: config.AWS_REGION,
      endpoint: config.STORAGE_ENDPOINT,
      forcePathStyle: Boolean(config.STORAGE_ENDPOINT),
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  private buildPublicUrl(key: string): string {
    if (config.STORAGE_PUBLIC_URL_BASE) {
      const base = config.STORAGE_PUBLIC_URL_BASE.replace(/\/$/, '');
      return `${base}/${key}`;
    }

    if (config.STORAGE_ENDPOINT) {
      const endpoint = config.STORAGE_ENDPOINT.replace(/\/$/, '');
      return `${endpoint}/${this.bucket}/${key}`;
    }

    return `https://${this.bucket}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;
  }

  private isManagedStorageUrl(fileUrl: string): boolean {
    return (
      fileUrl.includes(this.bucket) ||
      fileUrl.includes('amazonaws.com') ||
      fileUrl.includes('r2.cloudflarestorage.com') ||
      (config.STORAGE_PUBLIC_URL_BASE !== undefined &&
        fileUrl.startsWith(config.STORAGE_PUBLIC_URL_BASE)) ||
      fileUrl.startsWith('generations/')
    );
  }

  private extractObjectKey(fileUrl: string): string | null {
    try {
      if (fileUrl.startsWith('generations/')) {
        return fileUrl;
      }

      if (config.STORAGE_PUBLIC_URL_BASE && fileUrl.startsWith(config.STORAGE_PUBLIC_URL_BASE)) {
        const prefix = config.STORAGE_PUBLIC_URL_BASE.replace(/\/$/, '') + '/';
        return fileUrl.slice(prefix.length);
      }

      const url = new URL(fileUrl);
      let key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;

      if (key.startsWith(`${this.bucket}/`)) {
        key = key.slice(this.bucket.length + 1);
      }

      return key.length > 0 ? key : null;
    } catch {
      return null;
    }
  }

  async uploadImageFromBase64(
    base64Data: string,
    userId: string,
    generationId: string,
  ): Promise<UploadedMedia> {
    const buffer = Buffer.from(base64Data, 'base64');
    const key = `generations/${userId}/${generationId}/image.png`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
        CacheControl: 'max-age=31536000',
      }),
    );

    const media_url = this.buildPublicUrl(key);
    return { media_url, thumbnail_url: media_url };
  }

  async uploadVideoFromUrl(
    videoUrl: string,
    userId: string,
    generationId: string,
  ): Promise<UploadedMedia> {
    const response = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 120000,
      maxContentLength: 500 * 1024 * 1024,
    });
    const buffer = Buffer.from(response.data);
    const key = `generations/${userId}/${generationId}/video.mp4`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'video/mp4',
        CacheControl: 'max-age=31536000',
      }),
    );

    const media_url = this.buildPublicUrl(key);
    // Thumbnail from video frame — future enhancement; use video URL for now
    return { media_url, thumbnail_url: media_url };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.isManagedStorageUrl(fileUrl)) {
      return;
    }

    const key = this.extractObjectKey(fileUrl);
    if (!key) {
      return;
    }

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      logger.warn('Failed to delete file from storage', {
        fileUrl,
        key,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
