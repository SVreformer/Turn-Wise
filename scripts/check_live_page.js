const https = require('https');
https.get('https://svreformer.github.io/Turn-Wise/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    const start = data.indexOf('<script src=');
    const end = data.indexOf('</script>', start);
    console.log('Script tag:', data.substring(start, end + 9));
  });
});
