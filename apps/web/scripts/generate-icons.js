const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

async function generateAllIcons() {
    const svgPath = path.join(__dirname, '..', 'public', 'logo-mark.svg');
    const iconsDir = path.join(__dirname, '..', 'public', 'icons');
    const publicDir = path.join(__dirname, '..', 'public');

    // Ensure icons directory exists
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
    }

    const svgContent = fs.readFileSync(svgPath, 'utf8');

    console.log('Generating PWA icons and favicons from logo-mark.svg...\n');

    // PWA Icons
    const pwaIcons = [
        { size: 192, name: 'icon-192x192.png', dir: iconsDir },
        { size: 512, name: 'icon-512x512.png', dir: iconsDir },
        { size: 512, name: 'icon-maskable-512x512.png', dir: iconsDir }
    ];

    console.log('PWA Icons:');
    for (const { size, name, dir } of pwaIcons) {
        const resvg = new Resvg(svgContent, {
            fitTo: { mode: 'width', value: size },
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();
        fs.writeFileSync(path.join(dir, name), pngBuffer);
        console.log(`  ✓ ${name} (${size}x${size})`);
    }

    // Favicons
    const favicons = [
        { size: 16, name: 'favicon-16x16.png', dir: publicDir },
        { size: 32, name: 'favicon-32x32.png', dir: publicDir },
        { size: 48, name: 'favicon.ico', dir: publicDir },
        { size: 32, name: 'favicon.png', dir: publicDir }
    ];

    console.log('\nFavicons:');
    for (const { size, name, dir } of favicons) {
        const resvg = new Resvg(svgContent, {
            fitTo: { mode: 'width', value: size },
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();
        fs.writeFileSync(path.join(dir, name), pngBuffer);
        console.log(`  ✓ ${name} (${size}x${size})`);
    }

    console.log('\n✓ All icons and favicons generated successfully from logo-mark.svg!');
}

generateAllIcons().catch(console.error);
