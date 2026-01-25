const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'favicon.svg');

// Read the SVG
const svgContent = fs.readFileSync(svgPath, 'utf8');

async function generateIcons() {
  console.log('Generating PIGG icons with new sage green style...');

  try {
    // Generate 192x192 icon
    await sharp(Buffer.from(svgContent))
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'logo192.png'));
    console.log('Created logo192.png');

    // Generate 512x512 icon
    await sharp(Buffer.from(svgContent))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'logo512.png'));
    console.log('Created logo512.png');

    // Generate favicon.ico (32x32)
    await sharp(Buffer.from(svgContent))
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon-32.png'));
    console.log('Created favicon-32.png');

    console.log('\nAll icons generated successfully with sage green theme!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
