import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = path.join(process.cwd(), 'assets');
const filesToConvert = ['icon.png', 'splash.png', 'adaptive-icon.png'];

async function convertAssets() {
  for (const file of filesToConvert) {
    const filePath = path.join(assetsDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`Converting ${file}...`);
      const tempPath = filePath + '.temp.png';
      await sharp(filePath).png().toFile(tempPath);
      fs.renameSync(tempPath, filePath);
      console.log(`Successfully converted ${file} to real PNG format.`);
    }
  }
}

convertAssets().catch(console.error);
