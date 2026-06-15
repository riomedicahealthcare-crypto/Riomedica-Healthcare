import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'db.json');

console.log(`Reading database settings from ${dbPath}...`);

if (!fs.existsSync(dbPath)) {
  console.error(`Database file does not exist at ${dbPath}`);
  process.exit(1);
}

try {
  const dbContent = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(dbContent);
  const settings = db.settings || {};

  console.log("Database structure keys:", Object.keys(db));
  console.log("Current Settings Object:", JSON.stringify({ ...settings, smtpPassword: settings.smtpPassword ? '***' : '(empty)' }, null, 2));

  const smtpEmail = settings.smtpEmail || '';
  const smtpPassword = settings.smtpPassword || '';
  const otpChannel = settings.otpChannel || 'mock';

  if (otpChannel !== 'smtp') {
    console.warn(`WARNING: otpChannel is set to '${otpChannel}', not 'smtp'. Real email delivery is disabled in server configuration.`);
  }

  if (!smtpEmail || !smtpPassword) {
    console.error("ERROR: SMTP email or App Password is not configured in settings.");
    process.exit(1);
  }

  console.log(`Setting up nodemailer transporter for ${smtpEmail}...`);
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: smtpEmail,
      pass: smtpPassword
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  console.log("Sending a test email to the sender address...");
  const mailOptions = {
    from: `"Riomedica Healthcare Test" <${smtpEmail}>`,
    to: smtpEmail,
    subject: "SMTP Verification Connection Test",
    text: "This is a verification test to confirm your Gmail SMTP app password and configurations are working successfully."
  };

  await transporter.sendMail(mailOptions);
  console.log("SUCCESS: Email sent successfully! Your App Password is fully correct and Gmail SMTP is working.");

} catch (err) {
  console.error("FAILURE: SMTP test failed. Details:", err);
}

process.exit(0);
