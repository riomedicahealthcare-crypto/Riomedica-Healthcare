async function run() {
  const uploadUrl = 'https://riomedica-healthcare-1.onrender.com/uploads/packshot-1781626074062-795542447.png';
  const fallbackUrl = 'https://riomedica-healthcare-1.onrender.com/api/image/packshot/prod_mq97ntpl_gnpln_0';

  console.log('Testing upload URL:', uploadUrl);
  try {
    const res = await fetch(uploadUrl);
    console.log('Upload URL status:', res.status, res.statusText);
  } catch (err) {
    console.error('Upload URL error:', err.message);
  }

  console.log('Testing fallback URL:', fallbackUrl);
  try {
    const res = await fetch(fallbackUrl);
    console.log('Fallback URL status:', res.status, res.statusText);
    if (res.ok) {
      console.log('Fallback URL returned data!');
    } else {
      const text = await res.text();
      console.log('Fallback URL error response:', text);
    }
  } catch (err) {
    console.error('Fallback URL error:', err.message);
  }
}

run();
