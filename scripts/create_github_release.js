const https = require('https');

const postData = JSON.stringify({
  tag_name: 'v1.0.0',
  target_commitish: 'main',
  name: 'Turn Wise v1.0.0 — Official Release',
  body: 'Official v1.0.0 release of Turn Wise: Accessibility-First Indoor Station Navigation for KSR Bengaluru.\n\n- Full Station CAD vector map\n- Profile-Aware BoardingSure Missed-Train Risk Predictor\n- Live Indoor Dead Reckoning & Pedometer Navigation\n- AR / VR Spatial Station Navigator\n- Multilingual Concierge (English, Kannada, Hindi)',
  draft: false,
  prerelease: false
});

const options = {
  hostname: 'api.github.com',
  path: '/repos/SVreformer/Turn-Wise/releases',
  method: 'POST',
  headers: {
    'User-Agent': 'TurnWise-Deployer',
    'Authorization': `token ${process.env.GITHUB_TOKEN || ''}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Release Status:', res.statusCode);
    const json = JSON.parse(data);
    console.log('Release URL:', json.html_url);
    console.log('Upload URL:', json.upload_url);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.write(postData);
req.end();
