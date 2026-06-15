const url = 'https://riomedica-healthcare-1.onrender.com/api/branding';

async function checkServer() {
  console.log(`Checking server responsiveness on ${url}...`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    console.log(`Server responded with status: ${res.status} (${res.statusText})`);
  } catch (err) {
    console.error('Server is unresponsive:', err.message);
  }
}

checkServer();
