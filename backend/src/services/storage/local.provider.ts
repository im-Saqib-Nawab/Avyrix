import fs from 'fs/promises';
import path from 'path';
import { config } from '@/config';
import type { StorageProvider, UploadedMedia } from './types';

export class LocalFileStorageProvider implements StorageProvider {
  private getUploadDir(userId: string): string {
    return path.join(process.cwd(), 'public', 'uploads', userId);
  }

  private buildPublicUrl(userId: string, filename: string): string {
    const port = config.PORT;
    return `http://localhost:${port}/uploads/${userId}/${filename}`;
  }

  async uploadImageFromBase64(
    base64Data: string,
    userId: string,
    generationId: string,
  ): Promise<UploadedMedia> {
    const dir = this.getUploadDir(userId);
    await fs.mkdir(dir, { recursive: true });
    const filename = `${generationId}.png`;
    await fs.writeFile(path.join(dir, filename), Buffer.from(base64Data, 'base64'));
    const media_url = this.buildPublicUrl(userId, filename);
    return { media_url, thumbnail_url: media_url };
  }

  async uploadVideoFromUrl(
    videoUrl: string,
    userId: string,
    generationId: string,
  ): Promise<UploadedMedia> {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const dir = this.getUploadDir(userId);
    await fs.mkdir(dir, { recursive: true });
    const filename = `${generationId}.mp4`;
    await fs.writeFile(path.join(dir, filename), buffer);
    const media_url = this.buildPublicUrl(userId, filename);
    return { media_url, thumbnail_url: media_url };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const match = fileUrl.match(/\/uploads\/([^/]+)\/([^/?#]+)/);
      if (!match) return;
      const [, userId, filename] = match;
      await fs.unlink(path.join(this.getUploadDir(userId), filename));
    } catch {
      // ignore missing files
    }
  }
}
