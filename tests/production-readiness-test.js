const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');

const TEST_PORT = 3456;
const env = { ...process.env, PORT: String(TEST_PORT), ALLOWED_ORIGINS: 'http://localhost:3456' };

const serverProcess = spawn('node', ['server.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
let serverOutput = '';
serverProcess.stdout.on('data', d => serverOutput += d.toString());
serverProcess.stderr.on('data', d => serverOutput += d.toString());

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body: data, json });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTests() {
  await new Promise(r => setTimeout(r, 1200));

  console.log('🧪 1. Testing Security Headers & X-Powered-By...');
  const healthRes = await request('/api/health');
  assert.equal(healthRes.status, 200, 'Health endpoint should return 200');
  assert.equal(healthRes.headers['x-powered-by'], undefined, 'X-Powered-By must NOT be leaked');
  assert.equal(healthRes.headers['x-content-type-options'], 'nosniff', 'X-Content-Type-Options must be nosniff');
  assert.equal(healthRes.headers['x-frame-options'], 'SAMEORIGIN', 'X-Frame-Options must be SAMEORIGIN');
  console.log('   ✅ Security headers verified!');

  console.log('🧪 2. Testing Legal Pages for AdSense Compliance...');
  const privacyRes = await request('/privacy.html');
  assert.equal(privacyRes.status, 200, 'Privacy policy should return 200');
  assert.ok(privacyRes.body.includes('Privacy Policy'), 'Privacy policy body missing heading');
  assert.ok(privacyRes.body.includes('AdSense'), 'Privacy policy must disclose AdSense/Advertising');

  const termsRes = await request('/terms.html');
  assert.equal(termsRes.status, 200, 'Terms of use should return 200');
  assert.ok(termsRes.body.includes('Terms of Use'), 'Terms of use body missing heading');
  console.log('   ✅ Legal pages (/privacy.html & /terms.html) verified!');

  console.log('🧪 3. Testing CORS: Same-Host & PaaS Subdomains Allowed...');
  const sameHostRes = await request('/api/health', {
    headers: {
      'Host': 'smart-ai-hub.onrender.com',
      'Origin': 'https://smart-ai-hub.onrender.com'
    }
  });
  assert.equal(sameHostRes.status, 200, 'Same-host production requests must be allowed by CORS');

  const railwayRes = await request('/api/health', {
    headers: {
      'Origin': 'https://my-app.up.railway.app'
    }
  });
  assert.equal(railwayRes.status, 200, 'Railway subdomains must be allowed by CORS');
  console.log('   ✅ Dynamic same-origin & PaaS CORS verified!');

  console.log('🧪 4. Testing CORS: Malicious Cross-Site Origin Blocked...');
  const scamRes = await request('/api/health', {
    headers: {
      'Origin': 'https://scam-site.xyz'
    }
  });
  assert.equal(scamRes.status, 403, 'Unauthorized third-party origin must receive 403');
  assert.equal(scamRes.json?.error, 'Origin is not allowed.', 'CORS rejection error must be structured JSON');
  console.log('   ✅ Malicious cross-origin properly blocked with 403!');

  console.log('🧪 5. Testing Gemini Model Names in Source Code...');
  const serverCode = require('fs').readFileSync('server.js', 'utf8');
  assert.ok(!serverCode.includes('gemini-3.6-flash'), 'server.js must not contain invalid gemini-3.6-flash');
  assert.ok(serverCode.includes('gemini-1.5-flash'), 'server.js must use valid gemini-1.5-flash');

  const apiCode = require('fs').readFileSync('js/api.js', 'utf8');
  assert.ok(!apiCode.includes('gemini-3.6-flash'), 'js/api.js must not contain invalid gemini-3.6-flash');
  assert.ok(apiCode.includes('gemini-1.5-flash'), 'js/api.js must use valid gemini-1.5-flash');
  console.log('   ✅ Official Gemini 1.5 Flash models verified in both server.js and js/api.js!');

  console.log('\n======================================================');
  console.log('🎉 ALL 5 PRODUCTION-READINESS TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

runTests().then(() => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
}).catch(err => {
  console.error('❌ Test failed:', err.message);
  console.error('Server logs:', serverOutput);
  serverProcess.kill('SIGTERM');
  process.exit(1);
});
