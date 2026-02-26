import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directory = path.join(__dirname, 'src', 'components', 'recruitment');

const files = fs.readdirSync(directory);

for (const file of files) {
    if (!file.endsWith('.tsx')) continue;

    const filepath = path.join(directory, file);
    let content = fs.readFileSync(filepath, 'utf8');

    // Remove dark classes
    content = content.replace(/\s*dark:[a-zA-Z0-9\-\/\[\]\:]+/g, '');

    // Replace background colors
    content = content.replace(/bg-surface-light/g, 'bg-white');
    content = content.replace(/bg-gray-50\/50/g, 'bg-white');

    // Cleanup double spaces
    content = content.replace(/ +/g, ' ');
    content = content.replace(/" /g, '"').replace(/ "/g, '"');
    content = content.replace(/' /g, "'").replace(/ '/g, "'");

    fs.writeFileSync(filepath, content, 'utf8');
}

console.log('Dark mode classes removed and bg changed via Node ES Module.');
