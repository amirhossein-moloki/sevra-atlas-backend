import axios from 'axios';
import fs from 'fs';
import path from 'path';

const ASSETS_FILE = path.join(__dirname, 'beauty_assets_v2.json');
const DOWNLOAD_DIR = path.join(process.cwd(), 'uploads', 'seeded');

async function downloadFile(url: string, dest: string): Promise<void> {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(dest);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    console.log(`Creating directory: ${DOWNLOAD_DIR}`);
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  const assets = JSON.parse(fs.readFileSync(ASSETS_FILE, 'utf-8'));
  const categories = Object.keys(assets);

  for (const category of categories) {
    const items = assets[category];
    console.log(`Downloading ${category} images...`);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const ext = path.extname(new URL(item.url).pathname) || '.jpg';
      const filename = `${category}_${i + 1}${ext}`;
      const dest = path.join(DOWNLOAD_DIR, filename);

      console.log(`Downloading ${item.url} -> ${filename}`);
      try {
        await downloadFile(item.url, dest);
        item.localPath = `/uploads/seeded/${filename}`;
      } catch (error: any) {
        console.error(`Failed to download ${item.url}: ${error.message}`);
      }
    }
  }

  // Save the updated assets with local paths
  fs.writeFileSync(ASSETS_FILE, JSON.stringify(assets, null, 2));
  console.log('Finished downloading all assets.');
}

main().catch((err) => {
  console.error('Fatal error in download script:', err);
  process.exit(1);
});
