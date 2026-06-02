export const CREDIT_COSTS = {
  image: {
    standard_1024: 5,
    standard_wide: 8,
    hd: 10,
  },
  video: {
    short: 25,
    medium: 50,
    long: 75,
  },
} as const;

export type ImageCreditKey = keyof typeof CREDIT_COSTS.image;
export type VideoCreditKey = keyof typeof CREDIT_COSTS.video;

export function getImageCreditCost(size: string, quality: string): number {
  if (quality === 'hd') return CREDIT_COSTS.image.hd;
  if (size === '1792x1024' || size === '1024x1792') return CREDIT_COSTS.image.standard_wide;
  return CREDIT_COSTS.image.standard_1024;
}

export function getVideoCreditCost(durationSeconds: number): number {
  if (durationSeconds <= 10) return CREDIT_COSTS.video.short;
  if (durationSeconds <= 30) return CREDIT_COSTS.video.medium;
  return CREDIT_COSTS.video.long;
}
