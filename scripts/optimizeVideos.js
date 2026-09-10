// optimizeFolder.js

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// ratio 0.9
// const cropWidth = 1920;
// const cropHeight = 1080;

const cropWidth = 720;
const cropHeight = 1280;

// 👇 Set your folder path here
const folderPath = 'scribbles/-test/videoParallax/videos'; // <-- Change this to your folder path

// ---- No need to change below this line ----

const absFolderPath = path.resolve(folderPath);

if (!fs.existsSync(absFolderPath) || !fs.lstatSync(absFolderPath).isDirectory()) {
  console.error('❌ Invalid folder path:', absFolderPath);
  process.exit(1);
}

// Get all .mp4 files in the folder
const files = fs.readdirSync(absFolderPath).filter(f => f.toLowerCase().endsWith('.mp4'));

if (files.length === 0) {
  console.log('ℹ️ No .mp4 files found in folder.');
  process.exit(0);
}

files.forEach(file => {
  const inputPath = path.join(absFolderPath, file);
  const baseName = path.basename(file, '.mp4');
  const outputFile = path.join(absFolderPath, `${baseName}-mobile.webm`);

  const ffmpegCommand = `ffmpeg -y -i "${inputPath}" \
  -c:v libvpx-vp9 \
  -b:v 3M \
  -vf "scale=${cropWidth}:${cropHeight}:force_original_aspect_ratio=increase,crop=${cropWidth}:${cropHeight}:(in_w-${cropWidth})/2:(in_h-${cropHeight})/2,scale=${cropWidth}:${cropHeight}" \
  -c:a libopus \
  -b:a 128k \
  -threads 4 \
  -speed 2 \
  -row-mt 1 \
  -tile-columns 4 \
  -frame-parallel 1 \
  "${outputFile}"`;

  console.log(`🚀 Optimizing: ${inputPath}`);

  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error processing ${inputPath}:`, error.message);
      return;
    }
    console.log(`✅ Optimized file created: ${outputFile}`);
  });
});
