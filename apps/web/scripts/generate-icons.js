const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

async function generateAllIcons() {
    const appIconPath = path.join(__dirname, '..', 'public', 'app-icon.svg');
    const faviconPath = path.join(__dirname, '..', 'public', 'logo-mark.svg');
    const iconsDir = path.join(__dirname, '..', 'public', 'icons');
    const publicDir = path.join(__dirname, '..', 'public');

    // Ensure icons directory exists
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
    }

    const appIconContent = fs.readFileSync(appIconPath, 'utf8');
    const faviconContent = fs.readFileSync(faviconPath, 'utf8');

    console.log('Generating PWA icons and favicons...\n');

    // PWA Icons (using app-icon.svg with dark background)
    const pwaIcons = [
        { size: 192, name: 'icon-192x192.png', dir: iconsDir },
        { size: 512, name: 'icon-512x512.png', dir: iconsDir },
        { size: 512, name: 'icon-maskable-512x512.png', dir: iconsDir }
    ];

    console.log('PWA Icons (from app-icon.svg):');
    for (const { size, name, dir } of pwaIcons) {
        const resvg = new Resvg(appIconContent, {
            fitTo: { mode: 'width', value: size },
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();
        fs.writeFileSync(path.join(dir, name), pngBuffer);
        console.log(`  ✓ ${name} (${size}x${size})`);
    }

    // Favicons (using logo-mark.svg with transparent background)
    const favicons = [
        { size: 16, name: 'favicon-16x16.png', dir: publicDir },
        { size: 32, name: 'favicon-32x32.png', dir: publicDir },
        { size: 48, name: 'favicon.ico', dir: publicDir },
        { size: 32, name: 'favicon.png', dir: publicDir }
    ];

    console.log('\nFavicons (from logo-mark.svg):');
    for (const { size, name, dir } of favicons) {
        const resvg = new Resvg(faviconContent, {
            fitTo: { mode: 'width', value: size },
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();
        fs.writeFileSync(path.join(dir, name), pngBuffer);
        console.log(`  ✓ ${name} (${size}x${size})`);
    }

    console.log('\n✓ All icons and favicons generated successfully!');
    console.log('  - PWA icons: dark background (app-icon.svg)');
    console.log('  - Favicons: transparent background (logo-mark.svg)');
}

generateAllIcons().catch(console.error);
