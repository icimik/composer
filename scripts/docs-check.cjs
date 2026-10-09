const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const YAML = require('yaml');
const { assertPolicy } = require('./ci-policy.cjs');
const root = path.resolve(__dirname, '..');
const files = execFileSync(
  'git',
  ['-C', root, 'ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  {
    encoding: 'utf8'
  }
)
  .split('\0')
  .filter(Boolean);
const docs = files.filter(
  (file) =>
    file.endsWith('.md') &&
    (!file.includes('/') ||
      file.startsWith('.agents/') ||
      file.startsWith('docs/development/') ||
      file.startsWith('docs/decisions/') ||
      file === 'docs/research/README.md' ||
      file === 'docs/research/current-verification.md' ||
      file === 'docs/research/toolchain-upgrade.md' ||
      file === 'docs/research/09-后续设计与竞品调研.md')
);
let linkCount = 0;
for (const file of docs) {
  const text = fs.readFileSync(path.join(root, file), 'utf8').replace(/```[\s\S]*?```/g, '');
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|#)/.test(href)) continue;
    const target = path.resolve(root, path.dirname(file), decodeURIComponent(href.split('#')[0]));
    assert.ok(target.startsWith(root + path.sep), `Reference leaves repository: ${file}: ${href}`);
    assert.ok(fs.existsSync(target), `Broken reference: ${file}: ${href}`);
    linkCount++;
  }
  if (file.endsWith('/SKILL.md')) {
    assert.ok(text.split('\n').length <= 100, `Skill exceeds 100 lines: ${file}`);
    assert.doesNotMatch(text, /[一-龥]/, `Agent-facing skill is not English: ${file}`);
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    assert.ok(frontmatter, `Missing skill frontmatter: ${file}`);
    const metadata = YAML.parse(frontmatter[1]);
    assert.equal(typeof metadata.name, 'string');
    assert.equal(typeof metadata.description, 'string');
  }
}
for (const file of files.filter((file) => /\.ya?ml$/.test(file))) {
  const doc = YAML.parseDocument(fs.readFileSync(path.join(root, file), 'utf8'));
  assert.equal(doc.errors.length, 0, `Invalid YAML: ${file}`);
}
const workflow = YAML.parse(fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8'));
assertPolicy(workflow);
console.log(
  `Docs check passed: ${docs.length} Markdown files, ${linkCount} local references, skills, YAML and CI policy.`
);
