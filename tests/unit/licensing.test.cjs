const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file));
const manifest = JSON.parse(read('.agents/references/skills/provenance.json'));

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(file) : [file];
  });
}

test('MIT metadata, root license and installer notice inputs agree', () => {
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(pkg.license, 'MIT');
  assert.equal(lock.packages[''].license, 'MIT');
  assert.match(read('LICENSE').toString(), /^MIT License\n/);
  assert.match(read('LICENSE').toString(), /Icimik Composer contributors/);
  assert.ok(pkg.build.files.includes('LICENSE'));
  assert.ok(pkg.build.files.includes('THIRD_PARTY_NOTICES.md'));
  assert.ok(pkg.build.files.includes('framework/**/*'));
});

test('CC0 third-party terms and source revisions are explicit', () => {
  for (const source of [manifest.skills, manifest.framework]) {
    assert.equal(source.license, 'CC0-1.0');
    assert.match(source.commit, /^[a-f0-9]{40}$/);
    assert.match(source.repository, /^https:\/\/github.com\//);
  }
  assert.equal(manifest.skills.bundles.length, 7);
  assert.equal(manifest.files.length, 21);
  const skillsLicense = read('.agents/references/skills/LICENSE');
  assert.match(skillsLicense.toString(), /CC0 1.0 Universal/);
  assert.deepEqual(read('framework/LICENSE'), skillsLicense);
});

test('all copied upstream Markdown and licenses match recorded byte hashes', () => {
  const inventory = [
    ...listFiles(path.join(root, '.agents/references/skills')),
    ...listFiles(path.join(root, 'framework'))
  ]
    .map((file) => path.relative(root, file).split(path.sep).join('/'))
    .filter((file) => file !== 'framework/README.md')
    .filter((file) => file.endsWith('.md') || file.endsWith('/LICENSE'))
    .sort();
  assert.deepEqual(
    manifest.files.map((file) => file.path).sort(),
    inventory,
    'All copied Markdown and license files must be recorded'
  );
  for (const file of manifest.files) {
    assert.ok(
      file.path.startsWith('.agents/references/skills/') || file.path.startsWith('framework/')
    );
    assert.ok(file.path.endsWith('.md') || file.path.endsWith('/LICENSE'), 'No executor snapshot');
    assert.equal(
      createHash('sha256').update(read(file.path)).digest('hex'),
      file.sha256,
      file.path
    );
  }
});
