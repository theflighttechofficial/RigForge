// Static hosts serve 404.html with a 404 status for unknown paths; the app then renders its Not Found page.
import fs from 'fs';

fs.copyFileSync('dist/index.html', 'dist/404.html');
console.log('dist/404.html written');
