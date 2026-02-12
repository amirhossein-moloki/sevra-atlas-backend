export interface StorageProvider {
  save(key: string, buffer: Buffer, mime: string): Promise<string>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}
