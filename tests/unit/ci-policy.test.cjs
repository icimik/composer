const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('CI installer build and artifact upload are gated to main after verification', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '../../.github/workflows/ci.yml'), 'utf8');
  const boundary = workflow.indexOf('\n  package:\n');
  assert.ok(boundary > 0, 'installer job must be separate');
  const verification = workflow.slice(0, boundary);
  const packaging = workflow.slice(boundary);
  assert.doesNotMatch(verification, /upload-artifact|npm run dist/);
  assert.match(packaging, /needs: desktop/);
  assert.match(packaging, /if: github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/);
  assert.match(packaging, /npm run dist -- --publish never/);
  assert.match(packaging, /actions\/upload-artifact/);
  assert.doesNotMatch(packaging, /if: always\(\)|playwright-report\/|test-results\//);
});
