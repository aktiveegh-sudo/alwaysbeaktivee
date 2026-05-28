const url = 'https://msrmlnyzkkupdhanxgyp.functions.supabase.co/purchase-data';
const body = { order_id: 'a849cf11-3bc4-4325-8bc7-6ff4b94b2999' };

(async () => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log(text);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
