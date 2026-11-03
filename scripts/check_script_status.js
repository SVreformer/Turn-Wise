const https = require('https');
https.get('https://svreformer.github.io/Turn-Wise/_expo/static/js/web/index-89eee3261ca7787110ca5f8c5aaafc52.js', (res) => {
  console.log('Script HTTP Status:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  console.log('Content-Length:', res.headers['content-length']);
});

