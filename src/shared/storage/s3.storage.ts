import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageProvider } from './storage.provider';
import { config } from '../../config';

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrl?: string;

  constructor() {
    if (!config.storage.s3.accessKey || !config.storage.s3.secretKey || !config.storage.s3.bucket || !config.storage.s3.region) {
      throw new Error('S3 storage provider is missing required configuration');
    }

    this.client = new S3Client({
      endpoint: config.storage.s3.endpoint,
      region: config.storage.s3.region,
      credentials: {
        accessKeyId: config.storage.s3.accessKey,
        secretAccessKey: config.storage.s3.secretKey,
      },
      forcePathStyle: !!config.storage.s3.endpoint, // Often needed for custom S3-compatible providers like Minio or Liara
    });

    this.bucket = config.storage.s3.bucket;
    this.publicUrl = config.storage.s3.publicUrl;
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
    return `https://${this.bucket}.s3.${config.storage.s3.region}.amazonaws.com/${key}`;
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
