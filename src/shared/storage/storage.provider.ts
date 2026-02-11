export interface StorageProvider {
  save(key: string, buffer: Buffer, mime: string): Promise<string>;
}
