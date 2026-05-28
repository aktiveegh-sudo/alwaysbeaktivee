const url = 'https://lsocdjpflecduumopijn.supabase.co/functions/v1/developer-api/plans';
(async () => {
  try {
    const res = await fetch(url, { headers: { Authorization: 'Bearer swft_live_74686859a45448bea75376f0a64f97ed' } });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
})();
