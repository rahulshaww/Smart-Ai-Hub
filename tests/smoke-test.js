const assert = require('node:assert/strict');

const base = process.env.SMOKE_BASE_URL || 'http://localhost:3000';

async function request(path, options) {
  const response = await fetch(`${base}${path}`, options);
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch (_) { /* HTML is expected for page checks. */ }
  return { response, text, body };
}

async function main() {
  const home = await request('/');
  assert.equal(home.response.status, 200, 'homepage should return 200');
  assert.match(home.text, /Smart AI Hub/);

  for (const page of ['/privacy.html', '/terms.html']) {
    const result = await request(page);
    assert.equal(result.response.status, 200, `${page} should return 200`);
    assert.match(result.text, /Privacy|Terms/);
  }

  const health = await request('/api/health');
  assert.equal(health.response.status, 200, 'health should return 200');
  assert.equal(health.body.status, 'ok');

  const invalid = await request('/api/generate', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}'
  });
  assert.equal(invalid.response.status, 400, 'invalid generation request should return 400');

  for (const secret of ['/.env', '/package.json', '/server.js']) {
    const result = await request(secret);
    assert.equal(result.response.status, 403, `${secret} should be blocked`);
  }

  console.log(`Smoke tests passed for ${base}`);
}

main().catch(error => {
  console.error(`Smoke tests failed: ${error.message}`);
  process.exitCode = 1;
});
