import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageProvider } from './storage.provider';
import { env } from '../config/env';

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrl?: string;

  constructor() {
    if (!env.S3_ACCESS_KEY || !env.S3_SECRET_KEY || !env.S3_BUCKET || !env.S3_REGION) {
      throw new Error('S3 storage provider is missing required configuration');
    }

    this.client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
      forcePathStyle: !!env.S3_ENDPOINT, // Often needed for custom S3-compatible providers like Minio or Liara
    });

    this.bucket = env.S3_BUCKET;
    this.publicUrl = env.S3_PUBLIC_URL;
  }

  /**
   * Saves a file to S3.
   * NOTE: Current implementation assumes public bucket policy for access.
   * TODO: Implement Cloudfront/S3 Signed URLs for better security of private assets.
   * Requires cloud-side verification of bucket policies.
   */
  async save(key: string, buffer: Buffer, mime: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mime,
      })
    );

    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, '')}/${key}`;
    }

    // Default S3 URL format
    return `https://${this.bucket}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );

      if (!response.Body) return null;
      const arrayBuffer = await response.Body.transformToByteArray();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      if (error.name === 'NoSuchKey') return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }
}
