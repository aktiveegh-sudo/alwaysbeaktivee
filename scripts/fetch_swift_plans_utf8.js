import fs from 'fs';

const url = 'https://lsocdjpflecduumopijn.supabase.co/functions/v1/developer-api/plans';
(async () => {
  const res = await fetch(url, { headers: { Authorization: 'Bearer swft_live_74686859a45448bea75376f0a64f97ed' } });
  const data = await res.text();
  fs.writeFileSync('swift_plans_utf8.json', data, 'utf8');
  console.log('wrote swift_plans_utf8.json');
})();
