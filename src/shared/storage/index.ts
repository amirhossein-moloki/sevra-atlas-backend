import { config } from '../../config';
import { LocalStorageProvider } from './local.storage';
import { S3StorageProvider } from './s3.storage';
import { StorageProvider } from './storage.provider';

let storageProvider: StorageProvider;

export function getStorageProvider(): StorageProvider {
  if (storageProvider) return storageProvider;

  if (config.storage.provider === 's3') {
    storageProvider = new S3StorageProvider();
  } else {
    storageProvider = new LocalStorageProvider();
  }

  return storageProvider;
}
