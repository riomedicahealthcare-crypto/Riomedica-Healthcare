import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'data', 'db.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("=== Riomedica Healthcare SMTP Setup & Diagnostic Tool ===");
  console.log("This script will configure your Gmail SMTP settings and send a test email to verify credentials.\n");

  const email = "riomedicahealthcare@gmail.com";
  console.log(`Sender Account: ${email}`);

  const appPasswordInput = await askQuestion("Enter your 16-character Google App Password (spaces will be removed automatically): ");
  const appPassword = appPasswordInput.replace(/\s+/g, '');

  if (!appPassword || appPassword.length < 8) {
    console.error("Error: App Password is too short or invalid. It should be a 16-character string from Google account settings.");
    rl.close();
    process.exit(1);
  }

  // Load db.json
  if (!fs.existsSync(dbPath)) {
    console.error(`Error: Database file does not exist at ${dbPath}`);
    rl.close();
    process.exit(1);
  }

  let db = {};
  try {
    const dbContent = fs.readFileSync(dbPath, 'utf8');
    db = JSON.parse(dbContent);
  } catch (err) {
    console.error("Error parsing database file:", err.message);
    rl.close();
    process.exit(1);
  }

  // Backup old settings
  const oldSettings = db.settings ? { ...db.settings } : null;

  // Apply new settings
  db.settings = db.settings || {};
  db.settings.otpChannel = 'smtp';
  db.settings.smtpEmail = email;
  db.settings.smtpPassword = appPassword;

  // Write temporarily to db.json for testing
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log("\n[1/3] Temporary settings written to db.json.");
  } catch (err) {
    console.error("Error writing settings to database:", err.message);
    rl.close();
    process.exit(1);
  }

  console.log("[2/3] Setting up nodemailer SMTP transporter...");
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: email,
      pass: appPassword
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  console.log(`[3/3] Sending test SMTP verification email to ${email}...`);
  try {
    const mailOptions = {
      from: `"Riomedica Healthcare SMTP Test" <${email}>`,
      to: email,
      subject: "Riomedica SMTP Configuration Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #10b981;">SMTP Settings Verified Successfully!</h2>
          <p>This email confirms that the sender account <strong>${email}</strong> has been successfully configured to send real-time Gmail OTPs.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #666;">Riomedica Healthcare App System</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("\n=========================================================");
    console.log("🎉 SUCCESS: Test email sent successfully to your account!");
    console.log("Your Google App Password is correct and Gmail SMTP is working.");
    console.log("=========================================================");
    
    // Save settings permanently
    rl.close();
    process.exit(0);

  } catch (err) {
    console.error("\n=========================================================");
    console.error("❌ FAILURE: SMTP connection failed.");
    console.error("Google SMTP Error Code/Message:", err.message);
    console.error("=========================================================");

    console.log("\n--- DIAGNOSTIC HINTS ---");
    if (err.message.includes("Username and Password not accepted") || err.message.includes("Invalid credentials")) {
      console.log("💡 The 16-character App Password entered is incorrect.");
      console.log("💡 Ensure you generated an 'App Password' under your Google Account -> Security -> 2-Step Verification -> App Passwords.");
      console.log("💡 Do not use your regular Gmail account sign-in password.");
    } else if (err.message.includes("ENOTFOUND") || err.message.includes("ETIMEDOUT")) {
      console.log("💡 Connection timeout or network host unreachable.");
      console.log("💡 Check your internet connection or firewall/antivirus settings blocking port 465.");
    } else {
      console.log("💡 Check if 2-Step Verification is enabled on your Google Account (required to create App Passwords).");
    }

    const revert = await askQuestion("\nWould you like to revert to previous database settings? (y/n): ");
    if (revert.toLowerCase().startsWith('y')) {
      if (oldSettings) {
        db.settings = oldSettings;
      } else {
        delete db.settings;
      }
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
      console.log("Settings reverted.");
    } else {
      console.log("Keeping configuration (you can resolve issues or try again later).");
    }

    rl.close();
    process.exit(1);
  }
}

main();
