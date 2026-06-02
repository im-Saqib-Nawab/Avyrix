export interface UploadedMedia {
  media_url: string;
  thumbnail_url: string;
}

/**
 * Storage abstraction — swap implementations without changing callers.
 * Default: S3-compatible provider (AWS S3, Cloudflare R2, MinIO, etc.).
 */
export interface StorageProvider {
  uploadImageFromBase64(
    base64Data: string,
    userId: string,
    generationId: string,
  ): Promise<UploadedMedia>;

  uploadVideoFromUrl(
    videoUrl: string,
    userId: string,
    generationId: string,
  ): Promise<UploadedMedia>;

  deleteFile(fileUrl: string): Promise<void>;
}
