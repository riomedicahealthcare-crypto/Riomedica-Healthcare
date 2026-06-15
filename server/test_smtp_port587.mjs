import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'data', 'db.json');

try {
  const dbContent = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(dbContent);
  const settings = db.settings || {};

  const smtpEmail = settings.smtpEmail || '';
  const smtpPassword = settings.smtpPassword || '';

  console.log(`Setting up transporter for ${smtpEmail} on port 587...`);
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: smtpEmail,
      pass: smtpPassword
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  console.log("Sending test email...");
  const mailOptions = {
    from: `"Riomedica Healthcare Test" <${smtpEmail}>`,
    to: smtpEmail,
    subject: "SMTP Port 587 Connection Test",
    text: "This is a verification test to confirm your Gmail SMTP on port 587 works."
  };

  await transporter.sendMail(mailOptions);
  console.log("SUCCESS: Email sent successfully using port 587!");
} catch (err) {
  console.error("FAILURE: SMTP port 587 test failed. Details:", err.message);
}
process.exit(0);
