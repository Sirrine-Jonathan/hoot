const fs = require('fs');
const path = require('path');

const svg = `
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4facfe;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:1" />
        </linearGradient>
    </defs>
    <circle cx="64" cy="64" r="60" fill="url(#grad)" />
    <path d="M40 40 V88 M88 40 V88 M40 64 H88" stroke="white" stroke-width="12" stroke-linecap="round" />
    <circle cx="50" cy="52" r="4" fill="white" />
    <circle cx="78" cy="52" r="4" fill="white" />
</svg>
`;

const resourcesDir = path.join(__dirname, '..', 'resources');
if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir);
}

fs.writeFileSync(path.join(resourcesDir, 'icon.svg'), svg);
console.log('Clean Hoot icon generated as icon.svg');
