async function run() {
  const url = 'https://riomedica-healthcare-1.onrender.com/';
  console.log('Fetching headers from:', url);
  try {
    const res = await fetch(url);
    console.log('Status:', res.status, res.statusText);
    for (const [key, value] of res.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
