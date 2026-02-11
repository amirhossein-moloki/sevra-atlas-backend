import sharp from 'sharp';

export interface ImageVariant {
  url: string;
  storageKey: string;
  mime: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export async function processImage(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();

  // Optimization: Parallel processing
  const [avif, webp, thumb] = await Promise.all([
    sharp(buffer)
      .avif({ quality: 60 })
      .toBuffer({ resolveWithObject: true }),
    sharp(buffer)
      .webp({ quality: 75 })
      .toBuffer({ resolveWithObject: true }),
    sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true }),
  ]);

  return {
    original: {
      width: metadata.width,
      height: metadata.height,
      mime: `image/${metadata.format}`,
      sizeBytes: buffer.length,
    },
    variants: {
      avif: {
        buffer: avif.data,
        mime: 'image/avif',
        width: avif.info.width,
        height: avif.info.height,
        sizeBytes: avif.info.size,
      },
      webp: {
        buffer: webp.data,
        mime: 'image/webp',
        width: webp.info.width,
        height: webp.info.height,
        sizeBytes: webp.info.size,
      },
      thumbnail: {
        buffer: thumb.data,
        mime: 'image/webp',
        width: thumb.info.width,
        height: thumb.info.height,
        sizeBytes: thumb.info.size,
      }
    }
  };
}
