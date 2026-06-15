const url = 'https://riomedica-healthcare-1.onrender.com/api/settings';

async function checkSettings() {
  console.log(`Fetching settings from ${url}...`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`Failed to fetch settings: status ${res.status}`);
      return;
    }
    const data = await res.json();
    console.log('Live Settings on Render:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error fetching settings:', err.message);
  }
}

checkSettings();
