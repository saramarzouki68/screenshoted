const sharp = require('sharp');

const sizes = {
    'favicon-16x16.png': 16,
    'favicon-32x32.png': 32,
    'apple-touch-icon.png': 180,
    'android-chrome-192x192.png': 192,
    'android-chrome-512x512.png': 512
};

// Create a simple colored square as placeholder
const generateIcon = async (size, filename) => {
    await sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 13, g: 110, b: 253, alpha: 1 } // Bootstrap primary color
        }
    })
    .png()
    .toFile(`src/public/static/icons/${filename}`);
};

// Generate all icons
Object.entries(sizes).forEach(([filename, size]) => {
    generateIcon(size, filename);
});

// Generate favicon.ico (16x16)
generateIcon(16, 'favicon.ico');