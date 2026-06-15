const url = 'https://riomedica-healthcare-1.onrender.com/api/otp/send-email-otp';
const email = 'riomedicahealthcare@gmail.com';

async function testLiveOtp() {
  console.log(`Triggering live OTP send on Render to ${email} (with 15s timeout)...`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type: 'login' }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.log(`HTTP error: status ${res.status}`);
      return;
    }
    
    const data = await res.json();
    console.log('Live server response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error triggering live OTP:', err.message);
  }
}

testLiveOtp();
