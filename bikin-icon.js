const fs = require('fs');
const path = require('path');

// Pastikan folder public ada
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
    console.log('✅ Folder public dibuat.');
}

// Fungsi bikin PNG kotak sederhana (base64 dummy)
// Ini cuma kotak warna biru biar ada gambarnya dulu
const createDummyPNG = (filename, size) => {
    // Base64 dari kotak biru 1x1 pixel (bisa di-resize sama browser/OS)
    // Kita pake buffer minimalis biar valid
    const base64Png = `iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAQMAAADOtka5AAAAA1BMVEUAAP7EBIVbAAAAIklEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAADwBcUAAASb4O1kAAAAAElFTkSuQmCC`;
    
    const buffer = Buffer.from(base64Png, 'base64');
    fs.writeFileSync(path.join(publicDir, filename), buffer);
    console.log(`✅ ${filename} berhasil dibuat.`);
};

// Fungsi bikin SVG maskable
const createSVG = (filename) => {
    const svgContent = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="#000000"/></svg>`;
    fs.writeFileSync(path.join(publicDir, filename), svgContent);
    console.log(`✅ ${filename} berhasil dibuat.`);
};

// Eksekusi
createDummyPNG('pwa-192x192.png', 192);
createDummyPNG('pwa-512x512.png', 512);
createDummyPNG('apple-touch-icon.png', 180);
createSVG('mask-icon.svg');

console.log('🎉 Selesai! Icon dummy sudah siap. Push ke GitHub sekarang!');
