async function run() {
  const url = 'https://riomedica-healthcare-1.onrender.com/api/products';
  try {
    const res = await fetch(url);
    const products = await res.json();
    console.log('Total:', products.length);
    console.log('Names:', products.map(p => p.name).sort());
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();
