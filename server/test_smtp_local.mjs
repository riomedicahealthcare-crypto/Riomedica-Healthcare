import fs from 'fs';
import nodemailer from 'nodemailer';

const dbPath = './data/db.json';

console.log(`Reading database settings from ${dbPath}...`);

try {
  const dbContent = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(dbContent);
  const settings = db.settings || {};

  const smtpEmail = settings.smtpEmail || '';
  const smtpPassword = settings.smtpPassword || '';
  const otpChannel = settings.otpChannel || 'mock';

  console.log("otpChannel:", otpChannel);
  console.log("smtpEmail:", smtpEmail);

  if (!smtpEmail || !smtpPassword) {
    console.error("ERROR: SMTP email or App Password is not configured in settings.");
    process.exit(1);
  }

  console.log(`Setting up nodemailer transporter for ${smtpEmail}...`);
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
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
