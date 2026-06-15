import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'data', 'db.json');

try {
  if (!fs.existsSync(dbPath)) {
    console.error(`Database file does not exist at ${dbPath}`);
    process.exit(1);
  }

  const dbContent = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(dbContent);

  db.settings = db.settings || {};
  db.settings.otpChannel = 'smtp';
  db.settings.smtpEmail = 'riomedicahealthcare@gmail.com';
  db.settings.smtpPassword = 'wuvoaassufxtjsdg';

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log("SUCCESS: Settings successfully updated in db.json!");
  console.log("otpChannel set to 'smtp'");
  console.log("smtpEmail set to 'riomedicahealthcare@gmail.com'");
  console.log("smtpPassword configured.");
} catch (err) {
  console.error("Error updating settings:", err.message);
  process.exit(1);
}

process.exit(0);
