const fs = require('fs');
const path = require('path');

const src = `C:\\Users\\Omkar More\\.gemini\\antigravity-ide\\brain\\397bd89a-2312-4e58-a03b-25e7893468f1\\hindu_samagam_app_icon_1786282858693.png`;
const destDir = `C:\\MY-Projects\\AttendanceApp\\frontend\\assets`;
const dest = path.join(destDir, 'icon.png');

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log('✅ Icon successfully copied to frontend/assets/icon.png');
} catch (err) {
  console.error('Error copying icon:', err.message);
}
