import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import { config } from '@/config';
import { logger } from '@/services/logger.service';
import type { StorageProvider, UploadedMedia } from './types';

export class CloudinaryStorageProvider implements StorageProvider {
  constructor() {
    cloudinary.config({
      cloud_name: config.CLOUDINARY_CLOUD_NAME,
      api_key: config.CLOUDINARY_API_KEY,
      api_secret: config.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  private folder(userId: string, generationId: string): string {
    return `avyrix/generations/${userId}/${generationId}`;
  }

  async uploadImageFromBase64(
    base64Data: string,
    userId: string,
    generationId: string,
  ): Promise<UploadedMedia> {
    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64Data}`,
      {
        folder: this.folder(userId, generationId),
        public_id: 'image',
        overwrite: true,
        resource_type: 'image',
      },
    );

    const media_url = result.secure_url;
    return { media_url, thumbnail_url: media_url };
  }

  async uploadVideoFromUrl(
    videoUrl: string,
    userId: string,
    generationId: string,
  ): Promise<UploadedMedia> {
    try {
      const result = await cloudinary.uploader.upload(videoUrl, {
        folder: this.folder(userId, generationId),
        public_id: 'video',
        overwrite: true,
        resource_type: 'video',
      });

      const media_url = result.secure_url;
      const thumbnail_url =
        result.secure_url.replace('/upload/', '/upload/so_0/').replace(/\.[^/.]+$/, '.jpg') ||
        media_url;
      return { media_url, thumbnail_url };
    } catch (error) {
      logger.warn('Cloudinary remote video upload failed — downloading then uploading', {
        message: error instanceof Error ? error.message : String(error),
      });

      const response = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 120000,
        maxContentLength: 500 * 1024 * 1024,
      });
      const buffer = Buffer.from(response.data).toString('base64');

      const result = await cloudinary.uploader.upload(`data:video/mp4;base64,${buffer}`, {
        folder: this.folder(userId, generationId),
        public_id: 'video',
        overwrite: true,
        resource_type: 'video',
      });

      const media_url = result.secure_url;
      return { media_url, thumbnail_url: media_url };
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl.includes('cloudinary.com')) return;

    try {
      const url = new URL(fileUrl);
      const parts = url.pathname.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex === -1) return;

      let resourceParts = parts.slice(uploadIndex + 1);
      if (resourceParts[0]?.startsWith('v')) {
        resourceParts = resourceParts.slice(1);
      }

      const publicId = resourceParts.join('/').replace(/\.[^/.]+$/, '');
      const resourceType = fileUrl.includes('/video/') ? 'video' : 'image';

      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
      logger.warn('Failed to delete file from Cloudinary', {
        fileUrl,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
